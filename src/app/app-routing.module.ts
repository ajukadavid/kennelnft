import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DetailPageComponent } from './detail-page/detail-page.component';
import { FightHistoryComponent } from './fight-history/fight-history.component';
import { MainPageComponent } from './main-page/main-page.component';
import { SquadPageComponent } from './squad-page/squad-page.component';
import { UserPageComponent } from './user-page/user-page.component';

const routes: Routes = [
    { path: "history/:address/:id", component: FightHistoryComponent },
    { path: "detail/:address/:id", component: DetailPageComponent },
    { path: "dashboard", component: UserPageComponent },
    { path: "squad/:address", component: SquadPageComponent },
    { path: "", component: MainPageComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
