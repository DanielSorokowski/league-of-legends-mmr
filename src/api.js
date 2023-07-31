const apiKey = 'RGAPI-251dfcac-a568-4e8c-922b-0ca2a2cf2ec5'
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const getRanksByPlayerName = async (name, region) => {
  try {
    let continent = 'europe'

    if (region === 'br1' || region === 'la1' || region === 'la2' || region === 'na1') {
      continent = 'americas'
    } else if (region === 'eun1' || region === 'euw1' || region === 'tr1') {
      continent = 'europe'
    } else if (region === 'oc1' || region === 'sg2' || region === 'ph2' || region === 'vn2' || region === 'tw2' || region === 'th2') {
      continent = 'sea'
    } else if (region === 'ru1' || region === 'tr1' || region === 'jp1' || region === 'kr') {
      continent = 'asia'
    }

    const playerResponse = await fetch(`https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}?api_key=${apiKey}`);
    const player = await playerResponse.json();

    const historyResponse = await fetch(`https://${continent}.api.riotgames.com/lol/match/v5/matches/by-puuid/${player.puuid}/ids?start=0&count=10&api_key=${apiKey}`);
    const history = await historyResponse.json();

    const matchPromises = history.slice(0, 1).map((element) => {
      return () => {
        return fetch(`https://${continent}.api.riotgames.com/lol/match/v5/matches/${element}?api_key=${apiKey}`)
          .then((response) => response.json());
      };
    });

    const matches = await processQueue(matchPromises, 2); // Process 2 requests concurrently

    const participantPromises = matches.map((match) => {
      return () => {
        return Promise.all(match.info.participants.map((parti) => {
          return fetch(`https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${parti.summonerId}?api_key=${apiKey}`)
            .then((response) => response.json());
        }));
      };
    });

    const participantRanks = await processQueue(participantPromises, 2); // Process 2 requests concurrently

    const rankObjects = [];
    participantRanks.forEach((ranks) => {
      ranks
        .flatMap((rank) => rank)
        .forEach((entry) => {
          if (entry.queueType === 'RANKED_SOLO_5x5') {
            rankObjects.push({
              tier: entry.tier,
              rank: entry.rank,
              lp: entry.leaguePoints
            });
          }
        });
    });

    return rankObjects;
  } catch (error) {
    console.error('Error:', error.message);
    return []; // Return an empty array in case of an error
  }
};

const processQueue = async (queue, concurrency) => {
  const results = [];

  while (queue.length > 0) {
    const batch = queue.splice(0, concurrency);
    const batchResults = await Promise.all(batch.map((fn) => fn()));
    results.push(...batchResults);
    await delay(1000); // Add a delay of 1 second between batches
  }

  return results;
};