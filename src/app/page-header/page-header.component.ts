import { Component, OnInit } from '@angular/core';
import { NftContractsService } from '../nft-contracts.service';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent implements OnInit {

    public winnings = "0";
    public possible = "0";

  constructor(private nftContractsService: NftContractsService) { }

  async ngOnInit() {
      this.winnings = await this.nftContractsService.getWinnings();
      this.possible = await this.nftContractsService.getPossible();

  }

}
