import { OnDestroy, OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { CryptoWalletService } from './crypto-wallet.service';
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
    title = 'Kennel NFT Game';

    private resizeSubscription$: Subscription;

    constructor(private cryptoWalletService: CryptoWalletService) {

    }

    ngOnInit() {
        this.cryptoWalletService.checkConnection();
    }

    ngOnDestroy() {
        this.resizeSubscription$?.unsubscribe();
    }
}
