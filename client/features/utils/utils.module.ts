﻿// Do not import this module directly to any other module. use utils.ts from parent directory
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  NgbDatepickerModule,
  NgbTooltipModule,
  NgbAlertModule,
  NgbCollapseModule,
  NgbProgressbarModule,
  NgbTabsetModule,
  NgbPaginationModule
} from '@ng-bootstrap/ng-bootstrap';

import { ImageUploadModule } from './image-upload/image-upload.module';

import { LoadingComponent } from './loading/loading.component';
import { MessagingComponent } from './messaging/messaging.component';
import { PasswordValidatorComponent } from './password-validator/password-validator.component';

import { TooltipDirective } from './directives/tooltip.directive';
import { EqualValidatorDirective } from './directives/equal-validator.directive';
import { PasswordToggleDirective } from './directives/password-toggle.directive';
import { AnimatedLabelDirective } from './directives/animated-label.directive';
import { SplitDirective } from './directives/split.directive';
import { ReCaptchaDirective } from './directives/recaptcha.directive';
import { InputRestrictionDirective } from './directives/input-restriction.directive';

import { CsvPipe } from './pipes/csv.pipe';
import { SlugifyPipe } from './pipes/slugify.pipe';

import { ConfigService } from './services/config.service';
import { AuthGuard } from './services/auth-guard.service';
import { DirectAccessGuard } from './services/direct-access-guard.service';
import { AuthService } from './services/auth.service';
import { HandleErrorService } from './services/handle-error.service';
import { LoadingService } from './services/loading.service';
import { MessagingService } from './services/messaging.service';
import { PasswordValidatorService } from './services/password-validator.service';

export * from './pipes/slugify.pipe';

export * from './services/data.service';
export * from './services/app-load.service';
export * from './services/config.service';
export * from './services/auth-guard.service';
export * from './services/direct-access-guard.service';
export * from './services/auth.service';
export * from './services/handle-error.service';
export * from './services/loading.service';
export * from './services/messaging.service';
export * from './services/password-validator.service';
export * from './services/recaptcha.service';
export * from './services/cached-data.service';
export * from './services/seo.service';
export * from './services/script-injector.service';

export { LoadingInterceptor } from './services/loading.interceptor';
export { MessagingInterceptor } from './services/messaging.interceptor';

export { CanDeactivateGuard } from './services/can-deactivate-guard.service';

const components = [
  MessagingComponent,
  LoadingComponent,
  PasswordValidatorComponent
];

const modules = [
  NgbDatepickerModule,
  NgbTooltipModule,
  NgbAlertModule,
  NgbCollapseModule,
  NgbTabsetModule,
  NgbProgressbarModule,
  NgbPaginationModule,
  ImageUploadModule
];

const directives = [
  TooltipDirective,
  EqualValidatorDirective,
  PasswordToggleDirective,
  AnimatedLabelDirective,
  SplitDirective,
  ReCaptchaDirective,
  InputRestrictionDirective
];

const pipes = [
  CsvPipe,
  SlugifyPipe
];

const services = [
  ConfigService,
  AuthGuard,
  AuthService,
  DirectAccessGuard,
  HandleErrorService,
  LoadingService,
  MessagingService,
  PasswordValidatorService
];

@NgModule({
  declarations: [
    components,
    directives,
    pipes
  ],
  providers: [
    ...services
  ],
  imports: [
    CommonModule,
    FormsModule,
    ...modules
  ],
  exports: [
    ...components,
    ...directives,
    ...pipes,
    ...modules
  ]
})
export class UtilsModule { }
