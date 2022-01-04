import { DOCUMENT } from "@angular/common";
import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { ThemePalette } from "@angular/material/core";
import { Subscription } from "rxjs";
import { CryptoWalletService } from "../crypto-wallet.service";

@Component({
    selector: "app-wallet-info",
    templateUrl: "./wallet-info.component.html",
    styleUrls: ["./wallet-info.component.scss"]
})
export class WalletInfoComponent implements OnInit, OnDestroy {

    public badgeColor: ThemePalette = "primary";
    public get walletInfo(): any {
        return this.cryptoWalletService.walletInfo;
    };

    private subscription: Subscription = new Subscription();
    public showMenu = false;

    constructor(
        @Inject(DOCUMENT) private document: Document,
        private cryptoWalletService: CryptoWalletService,
        private cdr: ChangeDetectorRef) { }

    ngOnInit(): void {
        this.subscription.add(this.cryptoWalletService.updated$.subscribe((data) => {
            console.log("WalletInfoComponent", data);
            if (data) {
                if (!data.isConnected) {
                    this.badgeColor = "warn";
                } else {
                    this.badgeColor = "primary";
                }
            }
            this.cdr.detectChanges();
        }));
        this.checkColor();
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

    public switchColor() {
        const bodyElement = this.document.body;
        if (bodyElement) {
            if (bodyElement.classList.contains("light")) {
                bodyElement.classList.remove("light");
                bodyElement.classList.add("dark");
                localStorage.setItem("color-scheme", "dark");
            } else {
                bodyElement.classList.remove("dark");
                bodyElement.classList.add("light");
                localStorage.setItem("color-scheme", "light");
            }
        }
    }

    private checkColor() {
        const color = localStorage.getItem("color-scheme");
        if (color === "dark") {
            const bodyElement = this.document.body;
            if (bodyElement) {
                bodyElement.classList.remove("light");
                bodyElement.classList.add("dark");
            }
        }
    }

}
