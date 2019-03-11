import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserAccessControlComponent } from './user-access-control.component';
import { UtilsModule } from '../utils';

import { UserAccessControlService } from './services/user-access-control.service';

@NgModule({
    declarations: [
        UserAccessControlComponent
    ],
    imports: [
        CommonModule,
        UtilsModule
    ],
    providers: [
        UserAccessControlService
    ]
})

export class UserAccessControlModule { }
