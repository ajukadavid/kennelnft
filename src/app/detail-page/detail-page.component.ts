import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
    private subscription: Subscription = new Subscription();
    public get walletInfo(): any {
        return this.cryptoWalletService.walletInfo;
    };

    constructor(private route: ActivatedRoute,
        private nftContractsService: NftContractsService,
        private cryptoWalletService: CryptoWalletService,
        private nftImageService: NftImageService,
        private cd: ChangeDetectorRef,
        private notifyService: NotifyService) { }

    async ngOnInit() {
        this.id = this.route.snapshot.params['id'];
        this.address = this.route.snapshot.params['address'];
        console.log("this.id", this.id, this.address);
        this.fighter = await this.nftContractsService.getFighterBasicInfo(this.address, this.id);
        console.log("this.fighterInfo", this.fighter);
        this.subscribeToWallet();
        this.subscribeToTransactions();
    }


    public fight() {

    }

    public train() {

    }

    private subscribeToWallet() {
        this.subscription.add(this.cryptoWalletService.updated$.subscribe(async (data) => {
            console.log("subscribeToWallet", data);
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
            }
            this.cd.detectChanges();
        }));
    }

    public async revealFighter(fighter) {
        this.notifyService.pop("info", "Preparing data for fighter", "Reveal fighter");
        fighter.waiting = true;
        this.cd.detectChanges();
        const generatedImage = await this.nftImageService.generateImage(fighter.token, this.address);
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
        this.cd.detectChanges();
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
