import { View } from '../core/View';
import { State } from "../core/State"
import "../styles/home.css";

export class HomeView extends View {
  constructor() {
    super();
    this.state = new State({});
  }

  async render() {
    const template = document.createElement('template');
    template.innerHTML =  `
    <div id="page-container" class="hero">
           <div class="pattern-left"></div>
           <div class="pattern-right"></div>
           <div class="bg-hero">
               <div class="square"></div>
               <div class="square"></div>
               <div class="square"></div>
               <div class="wrapper_btn">
                   <div class="play btn" id="play">
                       <button >PLAY NOW</button>
                   
                   </div>
               </div>
           </div>
           <section class="sliders">
               <div class="wrapper">
                   <div class="marquee">
                       <p>
                       LET’S PLAY &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;LET’S PLAY
                       &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;LET’S PLAY
                       &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;LET’S PLAY
                       &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp; LET’S PLAY
                       &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;LET’S PLAY
                       &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;LET’S PLAY
                       &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;LET’S PLAY
                       &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;
                       </p>
                   </div>
                   </div>
                   <div class="wrapper_2">
                   <div class="marquee_2">
                       <p>
                       LET’S PLAY &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;LET’S PLAY
                       &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;LET’S PLAY
                       &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;LET’S PLAY
                       &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp; LET’S PLAY
                       &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;LET’S PLAY
                       &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;LET’S PLAY
                       &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;LET’S PLAY
                       &nbsp;&nbsp;LET’S PLAY &nbsp;&nbsp;
                       </p>
                   </div>
               </div>
           </section>
           <section class="resume">
               <div class="content">
                   <h1>WE ARE PING PONG</h1>
                   <div class="valorant-heading-container">
                       <h6 class="valorant-heading">DEFY YOUR LIMITS</h6>
                   </div>
                   <p>Ping Pong Blitz: Master. Outplay. Dominate.</p>
                   <ul>
                       <li>13-point rallies, pure skill.</li>
                       <li>Ranked & Unranked.</li>
                       <li>Deathmatch & Spike Rush.</li>
                       <li>Train with AI.</li>
                       <li>Chat with friends.</li>
                   </ul>
               </div>
               <div class="video">
                   <video src="/images/landing/video-1.mp4" autoplay loop muted></video>
               </div>
           </section>
           <section class="quote">
               <h2>
                   Become a ping pong legend! <br />
                   Rise to the challenge and dominate the table!
               </h2>
           </section>
           <section class="character-section">
             <div class="character-image">
               <div class="position-group">
                 <img src="/images/landing/player_1.png" alt="Player 1" class="animate-fade-in" />
                 <img src="/images/landing/player-5.png" alt="Player 2" class="animate-fade-in" />
               </div>
             </div>
             
             <div class="content">
               <h2 class="animate-fade-in">Your Player</h2>
               <div class="content-wrapper">
                 <h5 class="animate-fade-in">Forget paddles, unleash your power!</h5>
                 <p class="animate-fade-in">
                   More than reflexes, you'll wield a unique character with a game-changing ability. 
                   No two competitors fight the same. Curve the ball like a phantom, teleport across 
                   the court, or unleash a sonic smash. Your character is your weapon, your style 
                   is your signature. Prepare for highlight reels unlike any other!
                 </p>
                 <button class="view-all-button animate-fade-in">
                   View All Players
                 </button>
               </div>
             </div>

             <div class="character-image">
               <div class="position-group">
                 <img src="/images/landing/player-6.png" alt="Player 3" class="animate-fade-in" />
                 <img src="/images/landing/player-4.png" alt="Player 4" class="animate-fade-in" />
               </div>
             </div>
           </section>

           <section class="tables-section">
             <div class="tables-container">
               <div class="tables-content">
                 <h1 class="table-title">YOUR TABLES</h1>
                 <p class="fade-in">
                   Rule the globe, one ping pong table at a time! Unleash your character's power 
                   on unique tables, from Tokyo arcades to Rio beaches. Create legendary rallies 
                   and become a champion across diverse and exciting venues worldwide!
                 </p>
               </div>
               
               <div class="tables-gallery">
                 <div class="table-card fade-in">
                   <img src="/images/landing/table-1.jpg" alt="Tokyo Arcade Table" />
                   <span class="location-tag">Tokyo Arcade</span>
                 </div>
                 <div class="table-card fade-in">
                   <img src="/images/landing/table-2.jpg" alt="Rio Beach Table" />
                   <span class="location-tag">Rio Beach</span>
                 </div>
                 <div class="table-card fade-in">
                   <img src="/images/landing/table-3.jpg" alt="New York Streets Table" />
                   <span class="location-tag">NY Streets</span>
                 </div>
               </div>
             </div>
           </section>

           <footer class="footer-landing">
             <div class="glow"></div>
             <div class="footer-content">
               <p class="footer-text">CHALLENGE</p>
               <p class="footer-text">ACCEPTED</p>
               <p class="footer-text">BECOME A LEGEND</p>
             </div>
           </footer>
       </div>
   `;

    return template.content.firstElementChild;
  }

  async setupEventListeners() {
    this.addListener(this.$("#play"), "click", this.redirectToLogin.bind(this), {});
  }

  redirectToLogin() {
    this.router.navigate("/login")
  }

}

