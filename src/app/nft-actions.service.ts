import { Injectable } from "@angular/core";
import { CryptoWalletService } from "./crypto-wallet.service";
import { NftImageService } from "./nft-image.service";
import { NotifyService } from "./notify.service";

@Injectable({
    providedIn: "root"
})
export class NftActionsService {

    constructor (
        private cryptoWalletService: CryptoWalletService,
        private nftImageService: NftImageService,
        private notifyService: NotifyService) {
    }

    
    public async revealFighter(fighter, address) {
        try {
            // const generatedImage = { ipfs: "QmRV7cdzUSNkUNscjHx9x9TtbmoKMq6LQiYhT7guDp5kEV", error: undefined, url: "https://gateway.pinata.cloud/ipfs/QmRV7cdzUSNkUNscjHx9x9TtbmoKMq6LQiYhT7guDp5kEV" };// await this.nftImageService.generateImage(fighter.token, this.address);
            const generatedImage = await this.nftImageService.generateImage(fighter.token, address);
            console.log(generatedImage, "generatedImage");
            if (generatedImage.error) {
                this.notifyService.pop("error", generatedImage.error, "Image create problem");
                fighter.waiting = false;
                return;
            }
            if (generatedImage.ipfs) {
                const result = await this.cryptoWalletService.revealFighter(fighter.token, address, generatedImage.ipfs);
                if (result.result === true) {
                    fighter.metadata.image = generatedImage.url;
                    fighter.waiting = true;
                    fighter.tx = result.data;
                } else {
                    fighter.waiting = false;
                }
            }
        } catch (ex) {
            console.log(ex);
            this.notifyService.pop("error", ex.message, "Image create problem");
            fighter.waiting = false;
        }
    }

}
