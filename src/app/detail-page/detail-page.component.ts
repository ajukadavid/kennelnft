import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Clipboard } from "@angular/cdk/clipboard";
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { CryptoWalletService } from '../crypto-wallet.service';
import { NftActionsService } from '../nft-actions.service';
import { NftContractsService } from '../nft-contracts.service';
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
    public attacker;
    public deffender;
    public waiting = false;
    public allowed = false;
    public allowedKennel = false;
    public showDialog = false;
    public prices: { address: string; armorPrice: number; trainingPrice: number; tokenSymbol: string, lvlUpPrice: number; fightPrice: number; fightSymbol: string } =
        { address: undefined, armorPrice: undefined, trainingPrice: undefined, tokenSymbol: undefined, lvlUpPrice: undefined, fightPrice: undefined, fightSymbol: undefined };
    public tx = "";
    private subscription: Subscription = new Subscription();
    public get walletInfo(): any {
        return this.cryptoWalletService.walletInfo;
    };

    constructor(private route: ActivatedRoute,
        private nftContractsService: NftContractsService,
        private cryptoWalletService: CryptoWalletService,
        private nftActionsService: NftActionsService,
        private clipboard: Clipboard,
        private ngxSpinnerService: NgxSpinnerService,
        private cd: ChangeDetectorRef,
        private notifyService: NotifyService) { }

    async ngOnInit() {
        this.ngxSpinnerService.show();
        this.cd.detectChanges();
        this.id = this.route.snapshot.params['id'];
        this.address = this.route.snapshot.params['address'];
        console.log("this.id", this.id, this.address);
        this.prices = await this.nftContractsService.getPrices(this.address);
        this.subscribeToTransactions();
        this.subscribeToWallet();
        this.fighter = await this.nftContractsService.getFighterBasicInfo(this.address, this.id);
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

    public async levelUp(fighter) {
        const result = await this.cryptoWalletService.levelUp(fighter.token, this.address);
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
                this.allowed = allowed > Math.max(this.prices.trainingPrice, this.prices.armorPrice);
                const allowedKennel = await this.cryptoWalletService.checkAllowedKennel();
                this.allowedKennel = allowedKennel > this.prices.fightPrice;
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
                const fighter = this.fighter.token === data.data.tokenId ? this.fighter : undefined;
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
            } else if (data.status === "LvlUp completed") {
                const fighter = this.fighter.token === data.data ? this.fighter : undefined;
                console.log("LvlUp completed", data.data);

                if (fighter) {
                    fighter.waiting = false;
                    fighter.tx = undefined;
                    this.fighter = await this.nftContractsService.getFighterBasicInfo(this.address, this.id);
                    this.notifyService.pop("success", "Your fighter is upgraded", "LevelUp completed");
                }
            }
            
            this.cd.detectChanges();
        }));
    }

    public async revealFighter(fighter) {
        this.notifyService.pop("info", "Preparing data for fighter", "Reveal fighter");
        fighter.waiting = true;
        this.cd.detectChanges();
        await this.nftActionsService.revealFighter(fighter, this.address);
        this.cd.detectChanges();
    }

    // private testing() {
    //     this.attacker = {};
    //     this.deffender = {};
    //     this.showDialog = true;
    //     return;

    // }

    // public challengeCopy() {
    //     this.clipboard.copy(this.address + "/" + this.id);
    // }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
