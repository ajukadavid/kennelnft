import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { CryptoWalletService } from '../crypto-wallet.service';
import { NftContractsService } from '../nft-contracts.service';

@Component({
    selector: 'app-squad-page',
    templateUrl: './squad-page.component.html',
    styleUrls: ['./squad-page.component.scss']
})
export class SquadPageComponent implements OnInit, OnDestroy {

    public address;
    public info;
    public fighters = [];
    public waiting = false;
    public tx = "";
    private subscription: Subscription = new Subscription();
    public get walletInfo(): any {
        return this.cryptoWalletService.walletInfo;
    };

    constructor(private route: ActivatedRoute,
        private nftContractsService: NftContractsService,
        private cryptoWalletService: CryptoWalletService,
        private notifyService: ToastrService) { }

    async ngOnInit() {
        this.address = this.route.snapshot.params['address'];
        // this.info = { address: this.address, squad: "Test" };
        this.info = await this.nftContractsService.getSquadInfo(this.address);
        console.log("this.info", this.info);
        this.nftContractsService.getFightersInfo(this.address);
        console.log("this.fighters", this.fighters);
        this.subscribeToTransactions();
        this.subscribeToDataStream();
    }

    public async recruit() {
        const result = await this.cryptoWalletService.createFighter(this.address);
        if (result.result === true) {
            this.waiting = result.result;
            this.tx = result.data;
        }
    }

    private subscribeToTransactions() {
        this.subscription.add(this.cryptoWalletService.transactionStatus$.subscribe(async (data) => {
            if (data.status === "completed") {
                const newFighter = data?.data?.events?.NewFighter?.returnValues?.figherId;
                if (newFighter) {
                    this.nftContractsService.getFighterBasicInfo(this.address, newFighter);
                }
                this.waiting = false;
                this.tx = "";
            }
        }));
    }

    private subscribeToDataStream() {
        this.subscription.add(this.nftContractsService.dataStream$.subscribe(async (data) => {
            if (data.type === "fighter") {
                this.fighters.splice(0, 0, data.fighter);
                console.log("data.fighter", data.fighter);
            }
        }));
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
