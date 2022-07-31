import { Component, Input, OnInit } from '@angular/core';
import { NftContractsService } from '../nft-contracts.service';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent implements OnInit {

    @Input() info = {};
    public winnings = "0";
    public possible = "0";
    public toggleNavbar = true;

  constructor(private nftContractsService: NftContractsService) { }

  async ngOnInit() {
      this.winnings = await this.nftContractsService.getWinnings();
      this.possible = await this.nftContractsService.getPossible();

  }

}
