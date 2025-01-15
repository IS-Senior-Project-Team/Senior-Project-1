import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadHistoryComponent } from './upload-history.component';

describe('UploadHistoryComponent', () => {
  let component: UploadHistoryComponent;
  let fixture: ComponentFixture<UploadHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
