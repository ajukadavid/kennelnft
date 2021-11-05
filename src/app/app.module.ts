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
import {MatIconModule} from '@angular/material/icon';

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

@NgModule({
    declarations: [
        AppComponent,
        MainPageComponent,
        WalletInfoComponent,
        DetailPageComponent,
        UserPageComponent,
        SquadPageComponent,
        PageHeaderComponent,
        PageBottomComponent
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        OrderModule,
        CommonModule,
        MatFormFieldModule,
        Web3ModalModule,
        MatBadgeModule,
        MatSidenavModule,
        MatButtonModule,
        MatInputModule,
        NgxSpinnerModule,
        MatIconModule,
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
