import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subscription } from 'rxjs';
import { TRANSACTIONURL } from '../constants';
import { CryptoWalletService } from '../crypto-wallet.service';
import { NftActionsService } from '../nft-actions.service';
import { NftContractsService } from '../nft-contracts.service';
import { NotifyService } from '../notify.service';

@Component({
    selector: 'app-user-page',
    templateUrl: './user-page.component.html',
    styleUrls: ['./user-page.component.scss']
})
export class UserPageComponent implements OnInit, OnDestroy {

    public tranurl = TRANSACTIONURL;
    private subscription: Subscription = new Subscription();
    public get walletInfo(): any {
        return this.cryptoWalletService.walletInfo;
    };
    public fighters = [];
    public waitingKennel = false;
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
        this.loading = false;
        this.ngxSpinnerService.hide();
        this.cd.detectChanges();

    }

    public ngOnDestroy(): void {
        this.subscription.unsubscribe();   
    }

    private subscribeToDataStream() {
        this.subscription.add(this.nftContractsService.dataStream$.subscribe(async (data) => {
            if (data.type === "fighter" && !(this.fighters?.find((fighter) => (fighter.address === data.fighter.address && fighter.token === data.fighter.token)))) {
                this.fighters.splice(0, 0, data.fighter);
            }
            this.cd.detectChanges();
        }));
    }

    private subscribeToWallet() {
        this.subscription.add(this.cryptoWalletService.updated$.subscribe(async (data) => {
            if (this.walletInfo?.isConnected === true) {
                this.fighters = [];
                await this.cryptoWalletService.getUserFightersInfo();                
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
                }
            } else if (data.status === "NFT cancelled") {       
                const fighter = this.fighters.find((fight) => fight.token === data.data.tokenId);     
                if (fighter) {
                    fighter.waiting = false;
                }                                    
            } else if (data.status === "Fight completed") {
                const fighter = this.fighters.find((fight) => fight.token === data.data.tokenId);

                if (fighter) {
                    fighter.waiting = false;
                    fighter.tx = undefined;
                    this.notifyService.pop("success", "Fight finished ...", "Fight completed");
                }
            }
            this.cd.detectChanges();
        }));
    }

}
