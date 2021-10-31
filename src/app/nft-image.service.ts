import { Injectable } from "@angular/core";
import { BEURL} from "./constants";
import { HttpClient } from "@angular/common/http";

@Injectable({
    providedIn: "root"
})
export class NftImageService {

    constructor(private http: HttpClient ) {
    }

    public async generateImage(tokenId, address): Promise<any> {
        const data = await this.http.get(`${BEURL}/image/${address}/${tokenId}`).toPromise();
        return data as any;
    }

}
