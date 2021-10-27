import { Component, OnInit } from '@angular/core';
import { CryptoWalletService } from '../crypto-wallet.service';

@Component({
    selector: 'app-user-page',
    templateUrl: './user-page.component.html',
    styleUrls: ['./user-page.component.scss']
})
export class UserPageComponent implements OnInit {

    public get walletInfo(): any {
        return this.cryptoWalletService.walletInfo;
    };

    constructor(private cryptoWalletService: CryptoWalletService,
    ) { }

    ngOnInit(): void {
    }

    public trainFighter(fighter) {

    }
}
