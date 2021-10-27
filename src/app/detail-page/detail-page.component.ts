import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CryptoWalletService } from '../crypto-wallet.service';
import { NftContractsService } from '../nft-contracts.service';

@Component({
    selector: 'app-detail-page',
    templateUrl: './detail-page.component.html',
    styleUrls: ['./detail-page.component.scss']
})
export class DetailPageComponent implements OnInit {

    public id;
    public address;
    public fighterInfo;
    public get walletInfo(): any {
        return this.cryptoWalletService.walletInfo;
    };
        
    constructor(private route: ActivatedRoute,
              private nftContractsService: NftContractsService,
              private cryptoWalletService: CryptoWalletService,
            private notifyService: ToastrService) { }

    async ngOnInit() {
        this.id = this.route.snapshot.params['id'];
        this.address = this.route.snapshot.params['address'];
        console.log("this.id", this.id, this.address);
        this.fighterInfo = await this.nftContractsService.getFigherInfo(this.address, this.id);
        console.log("this.fighterInfo", this.fighterInfo);
    }


    public fight(){
        this.notifyService.info("FIGHT ...");
    }

    public train(){
        this.notifyService.info("TRAIN ...");
    }

    public release(){
        this.notifyService.info("RELEASE... ");
    }
}
