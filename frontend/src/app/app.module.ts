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

const routes: Routes = [{
    path: '',
    component: ContentComponent,
    children: [{
        path: 'category/:categoryId',
        component: CategoryDetailComponent,
    }, {
        path: 'category/:categoryId/ship/:shipId',
        component: ShipDetailComponent,
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
    ],
    bootstrap: [ AppComponent ],
})
export class AppModule { }
