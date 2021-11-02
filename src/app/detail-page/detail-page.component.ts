import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { CryptoWalletService } from '../crypto-wallet.service';
import { NftContractsService } from '../nft-contracts.service';
import { NftImageService } from '../nft-image.service';
import { NotifyService } from '../notify.service';

@Component({
    selector: 'app-detail-page',
    templateUrl: './detail-page.component.html',
    styleUrls: ['./detail-page.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailPageComponent implements OnInit, OnDestroy {

    public id;
    public address;
    public fighter;
    public waiting = false;
    public allowed = false;
    public allowedKennel = false;
    public prices: { address: string; armorPrice: number; trainingPrice: number; tokenSymbol: string } =
        { address: undefined, armorPrice: undefined, trainingPrice: undefined, tokenSymbol: undefined };
    public tx = "";
    private subscription: Subscription = new Subscription();
    public get walletInfo(): any {
        return this.cryptoWalletService.walletInfo;
    };

    constructor(private route: ActivatedRoute,
        private nftContractsService: NftContractsService,
        private cryptoWalletService: CryptoWalletService,
        private nftImageService: NftImageService,
        private ngxSpinnerService: NgxSpinnerService,
        private cd: ChangeDetectorRef,
        private notifyService: NotifyService) { }

    async ngOnInit() {
        this.ngxSpinnerService.show();
        this.cd.detectChanges();
        this.id = this.route.snapshot.params['id'];
        this.address = this.route.snapshot.params['address'];
        console.log("this.id", this.id, this.address);
        this.subscribeToWallet();
        this.subscribeToTransactions();
        this.fighter = await this.nftContractsService.getFighterBasicInfo(this.address, this.id);
        this.prices = await this.nftContractsService.getPrices(this.address);
        console.log("this.fighterInfo", this.fighter);
        this.ngxSpinnerService.hide();
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

    public async train(fighter) {
        const result = await this.cryptoWalletService.train(fighter.token, this.address);
        if (result.result === true) {
            fighter.waiting = true;
            fighter.tx = result.data;
        } else {
            fighter.waiting = false;
        }
        this.cd.detectChanges();
    }

    public async refillArmor(fighter) {
        const result = await this.cryptoWalletService.refillArmor(fighter.token, this.address);
        if (result.result === true) {
            fighter.waiting = true;
            fighter.tx = result.data;
        } else {
            fighter.waiting = false;
        }
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
            this.tx = result.data;
            this.waiting = true;
            this.cd.detectChanges();
        }
    }

    private subscribeToWallet() {
        this.subscription.add(this.cryptoWalletService.updated$.subscribe(async (data) => {
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
            if (data.status === "Reveal completed") {
                const fighter = this.fighter.token === data.data ? this.fighter : undefined;
                console.log("fighter", fighter);

                if (fighter) {
                    fighter.imageUploaded = true;
                    fighter.waiting = false;
                    fighter.tx = undefined;
                    this.notifyService.pop("success", "Your fighter was succesfully updated", "Reveal fighter");
                }
            } else if (data.status === "Fight completed") {
                const fighter = this.fighter.token === data.data ? this.fighter : undefined;
                console.log("Fight completed", data.data);

                if (fighter) {
                    fighter.waiting = false;
                    fighter.tx = undefined;
                    this.fighter = await this.nftContractsService.getFighterBasicInfo(this.address, this.id);
                    this.notifyService.pop("success", "Fight finished ...", "Fight completed");
                }
            } else if (data.status === "Training completed") {
                const fighter = this.fighter.token === data.data ? this.fighter : undefined;
                console.log("Training completed", data.data);

                if (fighter) {
                    fighter.waiting = false;
                    fighter.tx = undefined;
                    this.fighter = await this.nftContractsService.getFighterBasicInfo(this.address, this.id);                    
                    this.notifyService.pop("success", "Your fighter was succesfully updated", "Training completed");
                }
            } else if (data.status === "Refill completed") {
                const fighter = this.fighter.token === data.data ? this.fighter : undefined;
                console.log("Refill completed", data.data);

                if (fighter) {
                    fighter.waiting = false;
                    fighter.tx = undefined;
                    this.fighter = await this.nftContractsService.getFighterBasicInfo(this.address, this.id);                    
                    this.notifyService.pop("success", "Your fighter's armor succesfully updated", "Refill completed");
                }
            }
            this.cd.detectChanges();
        }));
    }

    public async revealFighter(fighter) {
        this.notifyService.pop("info", "Preparing data for fighter", "Reveal fighter");
        fighter.waiting = true;
        this.cd.detectChanges();
        try {
            const generatedImage = { ipfs: "QmRV7cdzUSNkUNscjHx9x9TtbmoKMq6LQiYhT7guDp5kEV", error: undefined, url: "https://gateway.pinata.cloud/ipfs/QmRV7cdzUSNkUNscjHx9x9TtbmoKMq6LQiYhT7guDp5kEV" };// await this.nftImageService.generateImage(fighter.token, this.address);
//            const generatedImage = await this.nftImageService.generateImage(fighter.token, this.address);
            console.log(generatedImage, "generatedImage");
            if (generatedImage.error) {
                this.notifyService.pop("error", generatedImage.error, "Image create problem");
                fighter.waiting = false;
                return;
            }
            if (generatedImage.ipfs) {
                const result = await this.cryptoWalletService.revealFighter(fighter.token, this.address, generatedImage.ipfs);
                if (result.result === true) {
                    fighter.metadata.image = generatedImage.url;
                    fighter.waiting = true;
                    fighter.tx = result.data;
                } else {
                    fighter.waiting = false;
                }
            }
        } catch (ex) {
            console.log(ex);
            this.notifyService.pop("error", ex.message, "Image create problem");
            fighter.waiting = false;
        }
        this.cd.detectChanges();
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
