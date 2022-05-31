import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';

import { Subscription } from 'rxjs';
import { TRANSACTIONURL } from '../constants';
import { CryptoWalletService } from '../crypto-wallet.service';
import { NftActionsService } from '../nft-actions.service';
import { NftContractsService } from '../nft-contracts.service';
import { NotifyService } from '../notify.service';

@Component({
    selector: 'app-squad-page',
    templateUrl: './squad-page.component.html',
    styleUrls: ['./squad-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SquadPageComponent implements OnInit, OnDestroy {

    public tranurl = TRANSACTIONURL;
    public address;
    public info;
    public fighters = [];
    public fighterName = "";
    public showDialog = false;
    public waiting = false;
    public allowed = {allowed: false, needed: "0", tokenSymbol: ""};
    public tx = "";
    public txKennel = "";
    private lastFighter = 0;
    private startFighter = 9999999;
    public fightersCount = 0;
    public loading = false;

    private subscription: Subscription = new Subscription();
    public get walletInfo(): any {
        return this.cryptoWalletService.walletInfo;
    };

    constructor(private route: ActivatedRoute,
        private nftContractsService: NftContractsService,
        private cryptoWalletService: CryptoWalletService,
        private nftActionsService: NftActionsService,
        private ngxSpinnerService: NgxSpinnerService,
        private cd: ChangeDetectorRef,
        private notifyService: NotifyService) { }

    async ngOnInit() {
        this.ngxSpinnerService.show();
        this.cd.detectChanges();
        this.address = this.route.snapshot.params['address'];
        this.info = await this.nftContractsService.getSquadInfo(this.address);
        this.subscribeToWallet();
        this.subscribeToTransactions();
        this.subscribeToDataStream();
        this.loading = true;
        await this.nftContractsService.getFightersInfo(this.address, 10);
        this.loading = false;
        this.ngxSpinnerService.hide();
        this.cd.detectChanges();
    }

    public async recruit() {
//        if (this.fighterName) {
            // pass fighter name to contract
            const result = await this.cryptoWalletService.createFighter(this.address, this.info.origRecruit);
            if (result.result === true) {
                this.waiting = result.result;
                this.tx = result.data;
                this.cd.detectChanges();
            }
            this.fighterName = "";
        // } else {
        //     this.notifyService.pop("error", "Missing fighter name", "Recruit problem");
        // }
    }

    public recruitFighter() {
        this.showDialog = true;
    }

    private subscribeToWallet() {
        this.subscription.add(this.cryptoWalletService.updated$.subscribe(async (data) => {
            console.log("subscribeToWallet", data);
            if (data?.isConnected === true) {
                const allowed = await this.cryptoWalletService.checkAllowed(this.address);
                this.allowed = allowed;
            } else {
                this.allowed = {allowed: false, needed: "0", tokenSymbol: ""};
            }
            this.cd.detectChanges();
        }));
    }

    private subscribeToTransactions() {
        this.subscription.add(this.cryptoWalletService.transactionStatus$.subscribe(async (data) => {
            console.log("subscribeToTransactions", data);
            if (data.status === "Fighter completed") {
                this.loading = true;
                await this.nftContractsService.getFightersInfo(this.address, undefined, this.lastFighter);
                this.loading = false;
                this.waiting = false;
                this.tx = "";
            } else if (data.status === "Reveal completed") {
                console.log("Reveal", data, this.fighters);
                const fighter = this.fighters.find((fight) => fight.token === data.data);

                if (fighter) {
                    fighter.imageUploaded = true;
                    fighter.waiting = false;
                    fighter.tx = undefined;
                    this.notifyService.pop("success", "Your fighter was succesfully updated", "Reveal fighter");
                    console.log("fighter", fighter);
                }
            } else if (data.status === "NFT cancelled") {                
                this.waiting = false;
            } else if (data.status === "Fight completed") {
                const fighter = this.fighters.find((fight) => fight.token === data.data.tokenId);
                console.log("Fight completed", data.data);

                if (fighter) {
                    fighter.waiting = false;
                    fighter.tx = undefined;
                    this.notifyService.pop("success", "Fight finished ...", "Fight completed");
                }
            }
            this.cd.detectChanges();
        }));
    }

    private subscribeToDataStream() {
        this.subscription.add(this.nftContractsService.dataStream$.subscribe(async (data) => {
            if (data.type === "fighter") {
                this.lastFighter = (this.lastFighter <= data.fighter.token) ? (data.fighter.token + 1) : this.lastFighter;
                this.startFighter = (this.startFighter > data.fighter.token) ? (data.fighter.token) : this.startFighter;
                this.fighters.splice(0, 0, data.fighter);
                console.log("data.fighter", data.fighter);
            } else if (data.type === "team") {
                this.fightersCount = data.fighters;
            }
            this.cd.detectChanges();
        }));
    }

    public async loadNext() {
        this.loading = true;
        await this.nftContractsService.getFightersInfo(this.address, 10, undefined, this.startFighter);
        this.loading = false;
        this.cd.detectChanges();
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
