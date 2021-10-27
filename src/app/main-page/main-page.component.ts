import { Component, OnInit } from '@angular/core';
import SwiperCore, {
    Navigation,
    Pagination,
    Scrollbar,
    Autoplay,
    Controller,
    SwiperOptions
} from "swiper";
import { NftContractsService } from '../nft-contracts.service';

SwiperCore.use([
    Navigation,
    Pagination,
    Scrollbar,
    Autoplay,
    Controller
]);
@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss']
})
export class MainPageComponent implements OnInit {

    public teams: any = [
        // { squad: "Kennel", image: "kennel-nft1.png", symbol: "Kennel", address: "0x000" },
        // { squad: "DPump", image: "kennel-nft2.jpg", symbol: "DPump", address: "0x000" },
        // { squad: "DEEZ", image: "kennel-nft1.png", symbol: "DEEZ", address: "0x000" },
        // { squad: "Knights", image: "kennel-nft1.png", symbol: "Kennel", address: "0x000" },
        // { squad: "SafeMoon", image: "kennel-nft2.jpg", symbol: "Kennel", address: "0x000" }
    ];
    public config: SwiperOptions = {
        loop: true,
        slidesPerView: 5,
        spaceBetween: 40,
        slidesPerGroup: 1,
        loopedSlides: 0,
        autoplay: { delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true },
        pagination: { clickable: true },
        navigation: false,
        breakpoints: {
            320: {
                slidesPerView: 1,
                spaceBetween: 10
            },
            640: {
                slidesPerView: 3,
                spaceBetween: 20
            },
            900: {
                slidesPerView: 5,
                spaceBetween: 40
            }
        }
    };

    constructor(private nftContractsService: NftContractsService) { }

    async ngOnInit() {
        this.teams = await this.nftContractsService.getKombatInfo();
        console.log("teams,", this.teams);
    }

}
