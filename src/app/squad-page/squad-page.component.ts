import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Subscription } from 'rxjs';
import { CryptoWalletService } from '../crypto-wallet.service';
import { NftContractsService } from '../nft-contracts.service';
import { NftImageService } from '../nft-image.service';
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
    public allowed = false;
    public tx = "";
    private lastFighter = 0;
    private subscription: Subscription = new Subscription();
    public get walletInfo(): any {
        return this.cryptoWalletService.walletInfo;
    };

    constructor(private route: ActivatedRoute,
        private nftContractsService: NftContractsService,
        private cryptoWalletService: CryptoWalletService,
        private nftImageService: NftImageService,
        private cd: ChangeDetectorRef,
        private notifyService: NotifyService) { }

    async ngOnInit() {
        this.notifyService.pop("info", "Getting data from contract", "Loading data");
        this.address = this.route.snapshot.params['address'];
        this.subscribeToWallet();
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
            this.cd.detectChanges();
        }
    }

    private subscribeToWallet() {
        this.subscription.add(this.cryptoWalletService.updated$.subscribe(async (data) => {
            console.log("subscribeToWallet", data);
            if (this.walletInfo.isConnected === true) {
                const allowed = await this.cryptoWalletService.checkAllowed(this.address);
                this.allowed = allowed;
            } else {
                this.allowed = false;
            }
            this.cd.detectChanges();
        }));
    }

    private subscribeToTransactions() {
        this.subscription.add(this.cryptoWalletService.transactionStatus$.subscribe(async (data) => {
            console.log("subscribeToTransactions", data);
            if (data.status === "Fighter completed") {
                // const newFighter = data?.data?.events?.NewFighter?.returnValues?.figherId;
                // if (newFighter) {
                //     this.nftContractsService.getFighterBasicInfo(this.address, newFighter);
                // }
                this.nftContractsService.getFightersInfo(this.address, this.lastFighter);
                this.waiting = false;
                this.tx = "";
            } else if (data.status === "Reveal completed") {
                console.log("Reveal", data, this.fighters);
                const fighter = this.fighters.find((fight) => fight.token === data.data);

                console.log("fighter", fighter);

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
            }
            this.cd.detectChanges();
        }));
    }

    private subscribeToDataStream() {
        this.subscription.add(this.nftContractsService.dataStream$.subscribe(async (data) => {
            if (data.type === "fighter") {
                this.lastFighter = (this.lastFighter <= data.fighter.token) ? (data.fighter.token + 1) : this.lastFighter;
                this.fighters.splice(0, 0, data.fighter);
                console.log("data.fighter", data.fighter);
            }
            this.cd.detectChanges();
        }));
    }

    public async approve() {
        const result = await this.cryptoWalletService.approve(this.address);
        if (result.result === true) {
            this.tx = result.data;
            this.waiting = true;
            this.cd.detectChanges();
        }
    }

    public async revealFighter(fighter) {
        this.notifyService.pop("info", "Preparing data for fighter", "Reveal fighter");
        const generatedImage = await this.nftImageService.generateImage(fighter.token, this.address);
        console.log(generatedImage, "generatedImage");
        if (generatedImage.error) {
            this.notifyService.pop("error", generatedImage.error, "Image create problem");
            return;
        }
        if (generatedImage.ipfs) {
            const result = await this.cryptoWalletService.revealFighter(fighter.token, this.address, generatedImage.ipfs);
            if (result.result === true) {
                fighter.metadata.image = generatedImage.url;
                fighter.waiting = true;
                fighter.tx = result.data;
                this.cd.detectChanges();
            }
        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
