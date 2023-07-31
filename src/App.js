import React, { useEffect, useState } from 'react';
import { rankList } from './ranked';
import { getRanksByPlayerName } from './api';
import './index.scss'
import { Loader } from './Components/Loader/Loader';

const App = () => {
  let sum = 0;

  const [loading, setLoading] = useState(true);
  const [mmrRank, setMmrRank] = useState(null);
  const [mmrValue, setMmrValue] = useState(0);
  const [username, setUsername] = useState('');
  const [region, setRegion] = useState('euw1')
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleChange = (event) => {
    setUsername(event.target.value); 
    setFormSubmitted(false)
  };

  const handleRegionChange = (event) => {
    setRegion(event.target.value); 
    setFormSubmitted(false)
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setFormSubmitted(true);

    try {
      const ranks = await getRanksByPlayerName(username, region);

      ranks.forEach(rank => sum += rankList.find(element => element.tier === rank.tier && element.rank === rank.rank).points);

      setMmrValue((ranks.map(rank => (rankList.find(element => element.tier === rank.tier && element.rank === rank.rank).points - 1) * 100 + rank.lp).reduce((sum, n) => sum + n, 0) / ranks.length).toFixed(2))

      const mmrRank = rankList.find(rank => rank.points === Math.floor(sum / ranks.length));

      setMmrRank(mmrRank);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error.message);
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className='app__background'></div>
      <div className='app__content'>
        <h1 className='app__title'>LOL MMR</h1>
        <h2 className='app__subtitle'>Check your league MMR</h2>
        <form onSubmit={handleSubmit} className='app__form'>
          <label className='app__label'>
            <span>Region</span>
            <select className='app__select' required onChange={handleRegionChange}>
              <option value='euw1'>EUW</option> 
              <option value='eun1'>EUNE</option> 
              <option value='na1'>NA</option> 
              <option value='br1'>BR</option>
              <option value='jp1'>JP</option> 
              <option value='kr'>KR</option> 
              <option value='la1'>LAN</option>
              <option value='la2'>LAS</option> 
              <option value='oc1'>OC</option>
              <option value='ph2'>PH</option> 
              <option value='ru'>RU</option>
              <option value='sg2'>SG</option>
              <option value='th2'>TH</option>
              <option value='tw2'>TW</option>
              <option value='tr1'>TR</option>
              <option value='vn2'>VN</option>
            </select>
          
          </label>
          <label className='app__label'>
            <span>Username</span>
            <input
              type="text"
              value={username}
              onChange={handleChange}
              className='app__input'
              required
            />
          </label>
          <button className='app__btn'>Search</button>
        </form>

        <p className='app__note'>Note that Riot Games does not share offical MMR value. This script will scan your match history and will calculate approximate mmr</p>

        {formSubmitted && !loading && !mmrRank ? <div className="app__error">No MMR data available. <br></br>Check username and region</div> : null}

        {formSubmitted && !loading && mmrRank ? (
          <div className='mmr'>
            <h2 className='mmr__title'>Your Mmr</h2>
            <h3 className='mmr__name'>{username}</h3>
            <img src={mmrRank.image} alt={mmrRank.tier} className='mmr__image'/>
            <p className='mmr__solution'>{mmrRank.tier} {mmrRank.rank}</p>
            <p className='mmr__value'>MMR: <span>{mmrValue}</span></p>
          </div>
        ) : null}

        {formSubmitted && loading ? <Loader /> : null}
      </div>
    </div>
  );
}

export default App;