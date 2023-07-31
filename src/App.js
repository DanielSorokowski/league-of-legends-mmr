import React, { useEffect, useState } from 'react';


function App() {
  const apiKey = 'RGAPI-251dfcac-a568-4e8c-922b-0ca2a2cf2ec5'
  let sum = 0;

  const ranked = [
    {
      tier: 'IRON',
      rank: 'IV',
      points: 1
    },
    {
      tier: 'IRON',
      rank: 'III',
      points: 2
    },
    {
      tier: 'IRON',
      rank: 'II',
      points: 3
    },
    {
      tier: 'IRON',
      rank: 'I',
      points: 4
    },
    {
      tier: 'BRONZE',
      rank: 'IV',
      points: 5
    },
    {
      tier: 'BRONZE',
      rank: 'III',
      points: 6
    },
    {
      tier: 'BRONZE',
      rank: 'II',
      points: 7
    },
    {
      tier: 'BRONZE',
      rank: 'I',
      points: 8
    },
    {
      tier: 'SILVER',
      rank: 'IV',
      points: 9
    },
    {
      tier: 'SILVER',
      rank: 'III',
      points: 10
    },
    {
      tier: 'SILVER',
      rank: 'II',
      points: 11
    },
    {
      tier: 'SILVER',
      rank: 'I',
      points: 12
    },
    {
      tier: 'GOLD',
      rank: 'IV',
      points: 13
    },
    {
      tier: 'GOLD',
      rank: 'III',
      points: 14
    },
    {
      tier: 'GOLD',
      rank: 'II',
      points: 15
    },
    {
      tier: 'GOLD',
      rank: 'I',
      points: 16
    },
    {
      tier: 'PLATINUM',
      rank: 'IV',
      points: 17
    },
    {
      tier: 'PLATINUM',
      rank: 'III',
      points: 18
    },
    {
      tier: 'PLATINUM',
      rank: 'II',
      points: 19
    },
    {
      tier: 'PLATINUM',
      rank: 'I',
      points: 20
    },
    {
      tier: 'EMERALD',
      rank: 'IV',
      points: 21
    },
    {
      tier: 'EMERALD',
      rank: 'III',
      points: 22
    },
    {
      tier: 'EMERALD',
      rank: 'II',
      points: 23
    },
    {
      tier: 'EMERALD',
      rank: 'I',
      points: 24
    },
    {
      tier: 'DIAMOND',
      rank: 'IV',
      points: 25
    },
    {
      tier: 'DIAMOND',
      rank: 'III',
      points: 26
    },
    {
      tier: 'DIAMOND',
      rank: 'II',
      points: 27
    },
    {
      tier: 'DIAMOND',
      rank: 'I',
      points: 28
    },
    {
      tier: 'MASTER',
      rank: 'I',
      points: 29
    },
    {
      tier: 'GRANDMASTER',
      rank: 'I',
      points: 30
    },
    {
      tier: 'CHALLENGER',
      rank: 'I',
      points: 31
    },
  ]

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const getRanksByPlayerName = async (name) => {
    try {
      const playerResponse = await fetch(`https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/${name}?api_key=${apiKey}`);
      const player = await playerResponse.json();
  
      const historyResponse = await fetch(`https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/${player.puuid}/ids?start=0&count=10&api_key=${apiKey}`);
      const history = await historyResponse.json();
  
      const matchPromises = history.slice(0, 1).map((element) => {
        return () => {
          return fetch(`https://europe.api.riotgames.com/lol/match/v5/matches/${element}?api_key=${apiKey}`)
            .then((response) => response.json());
        };
      });
  
      const matches = await processQueue(matchPromises, 2); // Process 2 requests concurrently
  
      const participantPromises = matches.map((match) => {
        return () => {
          return Promise.all(match.info.participants.map((parti) => {
            return fetch(`https://euw1.api.riotgames.com/lol/league/v4/entries/by-summoner/${parti.summonerId}?api_key=${apiKey}`)
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
  
  // State variables for loading and MMR rank
  const [loading, setLoading] = useState(true);
  const [mmrRank, setMmrRank] = useState(null);
  const [username, setUsername] = useState('');

  const handleChange = (event) => {
    setUsername(event.target.value); // Update the state with the typed username
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true); // Set loading to true when the form is submitted

    try {
      const ranks = await getRanksByPlayerName(username);

      ranks.forEach((rank) => {
        sum += ranked.find(
          (element) => element.tier === rank.tier && element.rank === rank.rank
        ).points;
      });

      const mmrRank = ranked.find(
        (rank) => rank.points === Math.floor(sum / ranks.length)
      );

      setMmrRank(mmrRank);
      setLoading(false); // Set loading to false once data is fetched
    } catch (error) {
      console.error('Error:', error.message);
      setLoading(false); // Set loading to false in case of an error
    }
  };

  return (
    <div className="App">
      <form onSubmit={handleSubmit}>
        <label>
          Enter your username:
          <input
            type="text"
            value={username}
            onChange={handleChange}
            required
          />
        </label>
        <button type="submit">Submit</button>
      </form>
      {loading ? (
        <div>Loading...</div>
      ) : mmrRank ? (
        <div>
          Your MMR is {mmrRank.tier} {mmrRank.rank}
        </div>
      ) : (
        <div>No MMR data available.</div>
      )}
    </div>
  );
}

export default App;