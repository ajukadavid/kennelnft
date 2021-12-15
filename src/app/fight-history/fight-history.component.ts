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
    selector: 'app-fight-history',
    templateUrl: './fight-history.component.html',
    styleUrls: ['./fight-history.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FightHistoryComponent implements OnInit, OnDestroy {

    public tranurl = TRANSACTIONURL;
    public id;
    public address;
    public myfighter;
    public opponents = [];
    public lastBlock = 0;

    private subscription: Subscription = new Subscription();
    public get walletInfo(): any {
        return this.cryptoWalletService.walletInfo;
    };

    constructor(private route: ActivatedRoute,
        private nftContractsService: NftContractsService,
        private cryptoWalletService: CryptoWalletService,
        private ngxSpinnerService: NgxSpinnerService,
        private cd: ChangeDetectorRef,
        private notifyService: NotifyService) { }

    async ngOnInit() {
        this.ngxSpinnerService.show();
        this.cd.detectChanges();
        this.id = this.route.snapshot.params['id'];
        this.address = this.route.snapshot.params['address'];
        this.lastBlock = await this.nftContractsService.getLastBlock();
        this.lastBlock = this.lastBlock - 4899;
        this.myfighter = await this.nftContractsService.getFighterBasicInfo(this.address, this.id);
        this.opponents = await this.nftContractsService.getOpponents(this.address, this.id, this.lastBlock);
        this.ngxSpinnerService.hide();
        this.cd.detectChanges();
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    async loadOlder() {
        this.lastBlock = this.lastBlock - 4899;
        const opponets = await this.nftContractsService.getOpponents(this.address, this.id, this.lastBlock);
        this.opponents = [...this.opponents, ...opponets];
        console.log("this.opponents", this.opponents);
        this.cd.detectChanges();
    }
}
