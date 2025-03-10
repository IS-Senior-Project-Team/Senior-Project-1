import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminProfileViewComponent } from './admin-profile-view.component';

describe('AdminProfileViewComponent', () => {
  let component: AdminProfileViewComponent;
  let fixture: ComponentFixture<AdminProfileViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProfileViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminProfileViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
