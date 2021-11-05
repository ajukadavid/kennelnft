import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { CryptoWalletService } from '../crypto-wallet.service';
import { NftActionsService } from '../nft-actions.service';
import { NftContractsService } from '../nft-contracts.service';
import { NotifyService } from '../notify.service';

@Component({
    selector: 'app-user-page',
    templateUrl: './user-page.component.html',
    styleUrls: ['./user-page.component.scss']
})
export class UserPageComponent implements OnInit {

    private subscription: Subscription = new Subscription();
    public get walletInfo(): any {
        return this.cryptoWalletService.walletInfo;
    };
    public fighters = [];
    public waitingKennel = false;
    public allowedKennel = false;
    public tx = "";
    public loading = false;

    constructor(private cryptoWalletService: CryptoWalletService,
        private ngxSpinnerService: NgxSpinnerService,
        private nftActionsService: NftActionsService,
        private nftContractsService: NftContractsService,
        private cd: ChangeDetectorRef,
        private notifyService: NotifyService
    ) { }

    async ngOnInit() {
        this.ngxSpinnerService.show();
        this.cd.detectChanges();
        this.subscribeToWallet();
        this.subscribeToTransactions();
        this.subscribeToDataStream();
        this.fighters = [];
        this.loading = true;
        await this.cryptoWalletService.getUserFightersInfo();
        this.loading = false;
        this.ngxSpinnerService.hide();
        this.cd.detectChanges();

    }

    private subscribeToDataStream() {
        this.subscription.add(this.nftContractsService.dataStream$.subscribe(async (data) => {
            if (data.type === "fighter") {
                this.fighters.splice(0, 0, data.fighter);
                console.log("data.fighter", data.fighter);
            }
            this.cd.detectChanges();
        }));
    }

    private subscribeToWallet() {
        this.subscription.add(this.cryptoWalletService.updated$.subscribe(async (data) => {
            if (this.walletInfo.isConnected === true) {
                const allowedKennel = await this.cryptoWalletService.checkAllowedKennel();
                this.allowedKennel = allowedKennel;
            } else {
                this.allowedKennel = false;
            }
            this.cd.detectChanges();
        }));
    }


    private subscribeToTransactions() {
        this.subscription.add(this.cryptoWalletService.transactionStatus$.subscribe(async (data) => {
            console.log("subscribeToTransactions", data);
            if (data.status === "Reveal completed") {
                console.log("Reveal", data, this.fighters);
                const fighter = this.fighters.find((fight) => fight.token === data.data);

                if (fighter) {
                    fighter.imageUploaded = true;
                    fighter.waiting = false;
                    fighter.tx = undefined;
                    this.notifyService.pop("success", "Your fighter was succesfully updated", "Reveal fighter");
                    console.log("fighter", fighter);
                }
            } else if (data.status === "Approve kennel completed") {
                console.log("Approve kennel", data);
                this.waitingKennel = false;
                this.allowedKennel = true;
                this.tx = undefined;
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

    public async approveKennel() {
        const result = await this.cryptoWalletService.approveKennel();
        if (result.result === true) {
            this.tx = result.data;
            this.waitingKennel = true;
            this.cd.detectChanges();
        }
    }

    public async revealFighter(fighter) {
        this.notifyService.pop("info", "Preparing data for fighter", "Reveal fighter");
        await this.nftActionsService.revealFighter(fighter, fighter.address);
        this.cd.detectChanges();
    }

    public async fight(fighter) {
        const result = await this.cryptoWalletService.fight(fighter.token, fighter.address);
        if (result.result === true) {
            fighter.waiting = true;
            fighter.tx = result.data;
        } else {
            fighter.waiting = false;
        }
        this.cd.detectChanges();
    }


}
