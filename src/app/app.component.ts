import { ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { ToasterConfig } from 'angular2-toaster';
import { Subscription } from 'rxjs';
import { DEFAULTNETWORK, NETWORKS } from './constants';
import { CryptoWalletService } from './crypto-wallet.service';
import { NotifyService } from './notify.service';
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
    title = 'Kennel NFT Game';

    private subscription: Subscription = new Subscription();
    public notifications = [];
    public showNotify = true;
    private id = 0;

    constructor(private cryptoWalletService: CryptoWalletService,
        private cdr: ChangeDetectorRef,
        private notifyService: NotifyService) {
    }

    ngOnInit() {
        this.cryptoWalletService.checkConnection();
        this.subscription.add(this.cryptoWalletService.updated$.subscribe((data) => {
            if (!data.isConnected) {
                this.notifyService.pop("error", `Switch to ${NETWORKS[DEFAULTNETWORK]}!`, "Wrong network");
                this.cdr.detectChanges();
            }
        }));
        this.subscription.add(this.notifyService.notifyStatus$.subscribe((data) => {
            data.id = this.id++;
            this.notifications.push(data);
            setTimeout(() => {
                this.removeNofity(data.id);
            }, 6000);
            this.cdr.detectChanges();
        }));
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    public removeNofity(id) {
        this.notifications = this.notifications.filter(notify => notify.id !== id);
        this.cdr.detectChanges();
    }
}
