import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCaseComponent } from './edit-case.component';

describe('EditCaseComponent', () => {
  let component: EditCaseComponent;
  let fixture: ComponentFixture<EditCaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCaseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditCaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
