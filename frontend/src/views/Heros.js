import { View } from "../core/View";
import { State } from "../core/State";
import "../styles/heros.css";

export class HerosView extends View {
  constructor() {
    super();
    this.state = new State({
      loading: false,
      error: null,
    });
  }
  async render() {
    const template = document.createElement("template");
    template.innerHTML = `
      <div class="slider">
            <div class="list">
                <div class="item active">
                    <img src="/images/heros/bg-iraqi.jpg" />
                    <div class="content">
                        <p>Green Mist</p>
                        <h2>IRAQI</h2>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Labore, neque?</p>
                    </div>
                </div>
                <div class="item">
                    <img src="/images/heros/bg-nexsus.jpg" />
                    <div class="content">
                        <p>Neon Phantom</p>
                        <h2>NEXSUS</h2>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Labore, neque?</p>
                    </div>
                </div>
                <div class="item">
                    <img src="/images/heros/bg-3.jpg" />
                    <div class="content">
                        <p>Pixel Pumper</p>
                        <h2>TOFO</h2>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Labore, neque?</p>
                    </div>
                </div>
                <div class="item">
                    <img src="/images/heros/bg-rock-fire.jpg" />
                    <div class="content">
                        <p>Fire Guardian</p>
                        <h2>RENZO</h2>
                        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Labore, neque?</p>
                    </div>
                </div>
            </div>
            <div class="arrows">
                <button class="prev">&lt;</button>
                <button class="next">&gt;</button>
            </div>
            <div class="thumbnail">
                <div class="item active">
                    <img src="/images/heros/iraqi.png" />
                    <div class="content">IRAQI</div>
                </div>
                <div class="item">
                    <img src="/images/heros/nexsus.png" />
                    <div class="content">NEXSUS</div>
                </div>
                <div class="item">
                    <img src="/images/heros/tofo.png" />
                    <div class="content">TOFO</div>
                </div>
                <div class="item">
                    <img src="/images/heros/renzo.png" />
                    <div class="content">RENZO</div>
                </div>
            </div>
        </div>
    `;

    return template.content.firstElementChild;
  }

  async setupEventListeners() {
    const initSlider = () => {
      const items = this.$$(".slider .list .item");
      const next = this.$(".slider .next");
      const prev = this.$(".slider .prev");
      const thumbnails = this.$$(".thumbnail .item");

      if (!next || !prev || !items.length || !thumbnails.length) {
        console.error("Could not find required elements");
        return;
      }

      let countItem = items.length;
      let itemActive = 0;
      let refreshInterval;

      const showSlider = () => {
        let itemActiveOld = this.$(".slider .list .item.active");
        let thumbnailActiveOld = this.$(".thumbnail .item.active");

        if (itemActiveOld) itemActiveOld.classList.remove("active");
        if (thumbnailActiveOld) thumbnailActiveOld.classList.remove("active");

        items[itemActive].classList.add("active");
        thumbnails[itemActive].classList.add("active");

        clearInterval(refreshInterval);
        refreshInterval = setInterval(() => {
          next.click();
        }, 5000);
      };

      next.onclick = function () {
        itemActive = (itemActive + 1) % countItem;
        showSlider();
      };

      prev.onclick = function () {
        itemActive = (itemActive - 1 + countItem) % countItem;
        showSlider();
      };

      thumbnails.forEach((thumbnail, index) => {
        thumbnail.addEventListener("click", () => {
          itemActive = index;
          showSlider();
        });
      });

      refreshInterval = setInterval(() => {
        next.click();
      }, 5000);
    };

    setTimeout(initSlider, 0);
  }
}
