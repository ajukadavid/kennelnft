import { Component, OnInit } from '@angular/core';
import { faTwitter, faTelegram, faDiscord } from "@fortawesome/free-brands-svg-icons";

@Component({
    selector: 'app-page-bottom',
    templateUrl: './page-bottom.component.html',
    styleUrls: ['./page-bottom.component.scss']
})
export class PageBottomComponent implements OnInit {

    constructor() { }

    public faTelegram = faTelegram;
    ngOnInit(): void {
    }

}
