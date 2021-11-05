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
import { NgxSpinnerService } from "ngx-spinner";

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

    public loaded = false;
    public show = false;
    public teams: any = [];
    public config: SwiperOptions;

    constructor(private nftContractsService: NftContractsService,
        private ngxSpinnerService: NgxSpinnerService,
    ) { }

    async ngOnInit() {
        this.ngxSpinnerService.show();
        const teams = await this.nftContractsService.getKombatInfo();
        this.teams = teams ? teams : [];
        this.config = {
            loop: this.teams?.length > 4,
            slidesPerView: (this.teams?.length > 4) ? 5 : (this.teams?.length + 1),
            spaceBetween: 40,
            slidesPerGroup: 1,
            loopedSlides: 0,
            autoplay: { delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true },
            pagination: (this.teams?.length > 4) ? { clickable: true } : false,
            navigation: false,
            breakpoints: {
                320: {
                    slidesPerView: 1,
                    spaceBetween: 10
                },
                640: {
                    slidesPerView: (this.teams?.length > 3) ? 3 : this.teams?.length,
                    spaceBetween: 20
                },
                900: {
                    slidesPerView: (this.teams?.length > 4) ? 5 : this.teams?.length,
                    spaceBetween: 40
                }
            }
        };
        this.ngxSpinnerService.hide();
        this.loaded = true;
    }

}
