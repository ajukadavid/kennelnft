import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';

import { Subscription } from 'rxjs';
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

    public address;
    public info;
    public fighters = [];
    public waiting = false;
    public waitingKennel = false;
    public allowed = false;
    public allowedKennel = false;
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
        this.subscribeToWallet();
        this.info = await this.nftContractsService.getSquadInfo(this.address);
        this.subscribeToTransactions();
        this.subscribeToDataStream();
        this.loading = true;
        await this.nftContractsService.getFightersInfo(this.address, 10);
        this.loading = false;
        this.ngxSpinnerService.hide();
        this.cd.detectChanges();
    }

    public async recruit() {
        const result = await this.cryptoWalletService.createFighter(this.address);
        if (result.result === true) {
            this.waiting = result.result;
            this.tx = result.data;
            this.cd.detectChanges();
        }
    }

    private subscribeToWallet() {
        this.subscription.add(this.cryptoWalletService.updated$.subscribe(async (data) => {
            console.log("subscribeToWallet", data);
            if (this.walletInfo.isConnected === true) {
                const allowed = await this.cryptoWalletService.checkAllowed(this.address);
                this.allowed = allowed;
                const allowedKennel = await this.cryptoWalletService.checkAllowedKennel();
                this.allowedKennel = allowedKennel;
            } else {
                this.allowed = false;
                this.allowedKennel = false;
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
            } else if (data.status === "Approve completed") {
                console.log("Approve", data);
                this.waiting = false;
                this.allowed = true;
            } else if (data.status === "Approve kennel completed") {
                console.log("Approve kennel", data);
                this.waitingKennel = false;
                this.allowedKennel = true;
                this.txKennel = undefined;
            } else if (data.status === "Fight completed") {
                const fighter = this.fighters.find((fight) => fight.token === data.data);
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


    public async approve() {
        const result = await this.cryptoWalletService.approve(this.address);
        if (result.result === true) {
            this.tx = result.data;
            this.waiting = true;
            this.cd.detectChanges();
        }
    }

    public async approveKennel() {
        const result = await this.cryptoWalletService.approveKennel();
        if (result.result === true) {
            this.txKennel = result.data;
            this.waitingKennel = true;
            this.cd.detectChanges();
        }
    }

    public async revealFighter(fighter) {
        this.notifyService.pop("info", "Preparing data for fighter", "Reveal fighter");
        await this.nftActionsService.revealFighter(fighter, this.address);
        this.cd.detectChanges();
    }

    public async fight(fighter) {
        const result = await this.cryptoWalletService.fight(fighter.token, this.address);
        if (result.result === true) {
            fighter.waiting = true;
            fighter.tx = result.data;
        } else {
            fighter.waiting = false;
        }
        this.cd.detectChanges();
    }


    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
