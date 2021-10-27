import { ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { CryptoWalletService } from "../crypto-wallet.service";

@Component({
    selector: "app-wallet-info",
    templateUrl: "./wallet-info.component.html",
    styleUrls: ["./wallet-info.component.scss"]
})
export class WalletInfoComponent implements OnInit, OnDestroy {

    public get walletInfo(): any {
        return this.cryptoWalletService.walletInfo;
    };

    private subscription: Subscription = new Subscription();
    public showMenu = false;

    constructor(private cryptoWalletService: CryptoWalletService,private cdr: ChangeDetectorRef) { }

    ngOnInit(): void {
        this.subscription.add(this.cryptoWalletService.updated$.subscribe((data) => {
            this.cdr.detectChanges();
        }));
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    public connectWallet() {
        this.cryptoWalletService.connectWallet();
    }

    public logout() {
        this.cryptoWalletService.disconnectWallet();        
    }


}
