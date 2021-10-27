import { Injectable } from "@angular/core";
import Web3 from "web3";
import * as _ from "lodash";
import { KOMBATADDRESS, WEB3URL } from "./constants";
import fighter from "../assets/abi/fighter.json";
import kombat from "../assets/abi/kombat.json";
import { ToastrService } from "ngx-toastr";
import { Observable, Subject } from "rxjs";

@Injectable({
    providedIn: "root"
})
export class NftContractsService {

    private provider;
    private web3;

    private dataStream: Subject<any> = new Subject();
    public dataStream$: Observable<any> = this.dataStream.asObservable();

    constructor(
        private toastr: ToastrService,
    ) { }

    private initWeb3(): any {
        if (!this.web3) {
            this.web3 = new Web3(WEB3URL);
        }
    }

    public async getKombatInfo(): Promise<{ address: string; squad: string; symbol: string }[]> {
        try {
            this.initWeb3();
            const teamsInfo = [];

            // get teams
            const contractKombat = new this.web3.eth.Contract(kombat.output.abi, KOMBATADDRESS);

            for (const num of [0, 1]) {
                let team = await contractKombat.methods.teams(num).call();
                console.log(team);

                //      for (const team of teams) {
                const contractFighter = new this.web3.eth.Contract(fighter.output.abi, team);
                const name = await contractFighter.methods.name().call();
                const symbol = await contractFighter.methods.symbol().call();
                teamsInfo.push({ address: team, squad: name, symbol });
                //      }
            }
            // get fighters info
            console.log(teamsInfo);
            return teamsInfo;
        } catch (ex) {
            this.toastr.error("We can't check Kombat contract, try again later", "Contract problem");
            // not connected
            console.log(ex);
        }
        return [];
    }

    public async getSquadInfo(address): Promise<{ address: string; name: string; symbol: string }> {
        let teamsInfo = { address: "", name: "", symbol: "" };
        try {
            this.initWeb3();
            const contractFighter = new this.web3.eth.Contract(fighter.output.abi, address);
            const name = await contractFighter.methods.name().call();
            const symbol = await contractFighter.methods.symbol().call();
            teamsInfo = { address, name, symbol };
            return teamsInfo;
        } catch (ex) {
            this.toastr.error("We can't check Kombat contract, try again later", "Contract problem");
            // not connected
            console.log(ex);
        }
        return teamsInfo;
    }

    public async getFightersInfo(address) {
        try {
            this.initWeb3();
            // get teams
            const contractFighter = new this.web3.eth.Contract(fighter.output.abi, address);
            let fighters = await contractFighter.methods.tokenCounter().call();
      //      this.dataStream.next({ type: "fighters", fighters }); TODO preload images...

            for (let fighter = 0; fighter < fighters; fighter++) {
                this.getFighterBasicInfo(address, fighter);
            }
        } catch (ex) {
            this.toastr.error("We can't check Kombat contract, try again later", "Contract problem");
            // not connected
            console.log(ex);
        }
    }


    public async getFighterBasicInfo(address, tokenId) {
        try {
            this.initWeb3();
            let teamContent;

            // get fighter
            const contractFighter = new this.web3.eth.Contract(fighter.output.abi, address);
            const name = await contractFighter.methods.tokenToName(tokenId).call();
            const image = await contractFighter.methods.tokenToImage(tokenId).call();
            const ownerOf = await contractFighter.methods.ownerOf(tokenId).call();
            
            teamContent = { token: tokenId, name, image, ownerOf };

            this.dataStream.next({ type: "fighter", fighter: teamContent })
        } catch (ex) {
            this.toastr.error("We can't check Kombat contract, try again later", "Contract problem");
            // not connected
            console.log(ex);
        }
    }




    public async getFigherInfo(address, tokenId): Promise<any> {
        try {
            this.initWeb3();
            const contractFighter = new this.web3.eth.Contract(fighter.output.abi, address);
            const metadata = await contractFighter.methods.tokenURI(tokenId).call();
            console.log("metadata", address, tokenId, metadata);
            const base64 = metadata.split(",")[1];
            console.log("base64", base64);
            console.log("info", Buffer.from(base64, 'base64').toString('ascii'));
            const json = JSON.parse(Buffer.from(base64, 'base64').toString('ascii').replace("\"attributes\":\"", "\"attributes\":").replace("]\", \"image", "], \"image"));
            return json;
        } catch (ex) {
            this.toastr.error("We can't check Kombat contract, try again later", "Contract problem");
            // not connected
            console.log(ex);
        }
        return {};
    }


}
