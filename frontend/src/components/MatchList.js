import "../styles/dashboard/matches.css"
import { matches } from '../mocks/sampleData.js';

export function MatchList() {
  if (!matches || matches.length === 0) {
    return `
     <div class="vx-matches vx-matches--empty">
       <div class="vx-matches__content">
         <div class="vx-matches__icon">
           <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
             <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#FF4655" stroke-width="2"/>
             <path d="M19.5 12C19.5 16.1421 16.1421 19.5 12 19.5C7.85786 19.5 4.5 16.1421 4.5 12C4.5 7.85786 7.85786 4.5 12 4.5C16.1421 4.5 19.5 7.85786 19.5 12Z" stroke="#FF4655" stroke-width="2"/>
             <line x1="5" y1="5" x2="19" y2="19" stroke="#FF4655" stroke-width="2"/>
           </svg>
         </div>
         <h3 class="vx-matches__title">NO MATCHES FOUND</h3>
         <p class="vx-matches__subtitle">Start your first game to begin your journey</p>
         <div class="vx-matches__action">
           <button class="vx-matches__button">PLAY NOW</button>
         </div>
       </div>
       <div class="vx-matches__decoration"></div>
     </div>
   `;
  }

  return `
   <div class="vx-matches">
     <h2 class="vx-matches__header">MATCH HISTORY</h2>
     <div class="vx-matches__list">
       ${matches.map(match => {
    const isXerxesPlayer1 = match.player1.name === 'XERXES';
    const xerxesScore = isXerxesPlayer1 ? match.score.split(':')[0] : match.score.split(':')[1];
    const opponentScore = isXerxesPlayer1 ? match.score.split(':')[1] : match.score.split(':')[0];
    const opponent = isXerxesPlayer1 ? match.player2 : match.player1;
    const isWinner = parseInt(xerxesScore) > parseInt(opponentScore);

    return `
           <div class="vx-matches__item ${isWinner ? 'winner' : 'looser'}">
             <div class="vx-matches__vs-info">
               <img src="${opponent.avatar}" alt="${opponent.name}" class="vx-matches__avatar">
               <div class="vx-matches__details">
                 <span class="vx-matches__vs-text">VS</span>
                 <span class="vx-matches__opponent">${opponent.name}</span>
               </div>
             </div>
             <div class="vx-matches__score">
               <span class="vx-matches__number">${xerxesScore} : ${opponentScore}</span>
             </div>
           </div>
         `;
  }).join('')}
     </div>
   </div>
 `;
}