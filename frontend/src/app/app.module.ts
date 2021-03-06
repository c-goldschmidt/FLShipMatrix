import { FormsModule } from '@angular/forms';
import { ShipResolver, CategoryResolver } from './services/resolver';
import { ShipRenderComponent } from './components/ship-detail/ship-render/ship-render.component';
import { ImageSwitcherComponent } from './components/image-switcher/image-switcher.component';
import { ContentComponent } from './components/content/content.component';
import { ViewService } from './services/view-service';
import { ShipDetailService, CategoryService, StaticService, TextureService } from './services/services';
import { ShipDetailComponent } from './components/ship-detail/ship-detail.component';
import { CategoryDetailComponent } from './components/category-detail/category-detail.component';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { EmptyComponent } from './components/empty-component/empty.component';
import { CategoryTreeComponent } from './components/category-tree/category-tree.component';
import { HttpModule } from '@angular/http';
import { ShipInfocardComponent } from './components/ship-detail/ship-infocard/ship-infocard.component';
import { Constants } from './constants'

const routes: Routes = [{
    path: '',
    redirectTo: 'fl',
    pathMatch: 'full',
}, {
    path: 'fl',
    component: ContentComponent,
    children: [{
        path: 'category/:categoryId',
        component: CategoryDetailComponent,
        resolve: {
            category: CategoryResolver,
        },
    }, {
        path: 'category/:categoryId/ship/:shipId',
        component: ShipDetailComponent,
        resolve: {
            ship: ShipResolver,
        },
    }, {
        path: '*',
        component: EmptyComponent,
    }],
}];

@NgModule({
    imports: [
        RouterModule.forRoot(routes),
        BrowserModule,
        HttpModule,
        FormsModule,
    ],
    declarations: [
        AppComponent,
        CategoryTreeComponent,
        EmptyComponent,
        ShipDetailComponent,
        CategoryDetailComponent,
        ContentComponent,
        ImageSwitcherComponent,
        ShipInfocardComponent,
        ShipRenderComponent,
    ],
    providers: [
        ViewService,
        CategoryService,
        ShipDetailService,
        StaticService,
        TextureService,
        CategoryResolver,
        ShipResolver,
    ],
    bootstrap: [ AppComponent ],
})
export class AppModule { }
