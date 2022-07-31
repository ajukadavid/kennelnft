import { CommonModule } from "@angular/common";
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { MatButtonModule } from "@angular/material/button";
import { MatInputModule } from "@angular/material/input";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MatFormFieldModule } from "@angular/material/form-field";
import { Web3ModalModule, Web3ModalService } from "@mindsorg/web3modal-angular";
import { MatBadgeModule } from "@angular/material/badge";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { HttpClientModule } from "@angular/common/http";
import { RouterModule } from "@angular/router";
import { SwiperModule } from "swiper/angular";
import { OrderModule } from "ngx-order-pipe";
import { NgxSpinnerModule } from "ngx-spinner";
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip'; 
import {MatIconModule} from '@angular/material/icon';
import {ClipboardModule} from '@angular/cdk/clipboard'; 
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainPageComponent } from './main-page/main-page.component';
import { WalletInfoComponent } from './wallet-info/wallet-info.component';
import { DetailPageComponent } from './detail-page/detail-page.component';
import { UserPageComponent } from './user-page/user-page.component';
import { FlexLayoutModule } from '@angular/flex-layout';
import { SquadPageComponent } from './squad-page/squad-page.component';
import { PageHeaderComponent } from './page-header/page-header.component';
import { PageBottomComponent } from './page-bottom/page-bottom.component';
import { FancyDialogComponent } from './fancy-dialog/fancy-dialog.component';
import { FightHistoryComponent } from "./fight-history/fight-history.component";
import { FilterValuePipe } from "./detail-page/detail-filter.pipe";

@NgModule({
    declarations: [
        AppComponent,
        MainPageComponent,
        WalletInfoComponent,
        DetailPageComponent,
        UserPageComponent,
        SquadPageComponent,
        PageHeaderComponent,
        PageBottomComponent,
        FightHistoryComponent,
        FancyDialogComponent,
        FilterValuePipe
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        NgbModule,
        OrderModule,
        CommonModule,
        MatFormFieldModule,
        Web3ModalModule,
        MatBadgeModule,
        MatSidenavModule,
        MatButtonModule,
        MatTooltipModule,
        MatInputModule,
        NgxSpinnerModule,
        ClipboardModule,
        MatIconModule,
        FontAwesomeModule,
        FlexLayoutModule,
        FormsModule,
        RouterModule.forRoot([]),
        ReactiveFormsModule,
        SwiperModule,
        HttpClientModule,
        BrowserAnimationsModule,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: [{
        provide: Web3ModalService,
        useFactory: () => {
            return new Web3ModalService({
                network: "binance", // optional
                cacheProvider: true, // optional
                providerOptions: {
                    walletconnect: {
                        package: WalletConnectProvider,
                        options: {
                            rpc: {
                                56: "https://bsc-dataseed.binance.org/",
                                1: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
                                321: "https://rpc-mainnet.kcc.network",
                                4: "https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
                                97: "https://data-seed-prebsc-1-s2.binance.org:8545/"
                            },
                            network: "binance",
                        }
                    }
                }, // required
                disableInjectedProvider: false,
            });
        },
    },],
    bootstrap: [AppComponent]
})
export class AppModule { }
