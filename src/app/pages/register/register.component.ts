import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { UserCreate } from '../../interfaces/user.interface';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  error = '';
  success = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', [
        Validators.required, 
        Validators.minLength(3), 
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z0-9_-]+$/)
      ]],
      email: ['', [
        Validators.required, 
        Validators.email,
        Validators.maxLength(254)
      ]],
      full_name: ['', [Validators.maxLength(100)]],
      password: ['', [
        Validators.required, 
        Validators.minLength(6),
        Validators.maxLength(128)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else if (confirmPassword?.errors?.['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      this.error = '';

      const formValue = this.registerForm.value;
      
      const userCreateData: any = {
        username: formValue.username?.trim(),
        email: formValue.email?.trim(),
        password: formValue.password
      };

      if (formValue.full_name && formValue.full_name.trim()) {
        userCreateData.full_name = formValue.full_name.trim();
      }

      this.authService.register(userCreateData).subscribe({
      next: (response) => {
        console.log('Registro exitoso:', response);
        this.success = true;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        if (err.status === 400 && err.error?.error) {
          const errorMessage = err.error.error;
          if (errorMessage.includes('Email')) {
            this.error = 'Este correo electrónico ya está registrado.';
          } else if (errorMessage.includes('Username')) {
            this.error = 'Este nombre de usuario ya está en uso.';
          } else {
            this.error = 'Los datos proporcionados son inválidos.';
          }
        } else {
          this.error = 'Ocurrió un error inesperado al registrar.';
        }
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        return `${this.getFieldDisplayName(fieldName)} es requerido`;
      }
      if (field.errors['minlength']) {
        return `${this.getFieldDisplayName(fieldName)} debe tener al menos ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldDisplayName(fieldName)} debe tener máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      }
      if (field.errors['email']) {
        return 'Email debe tener un formato válido';
      }
      if (field.errors['pattern']) {
        if (fieldName === 'username') {
          return 'Usuario solo puede contener letras, números, guiones bajos y guiones';
        }
        return 'Formato inválido';
      }
      if (field.errors['passwordMismatch']) {
        return 'Las contraseñas no coinciden';
      }
    }
    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const fieldNames: { [key: string]: string } = {
      'username': 'Usuario',
      'email': 'Email',
      'full_name': 'Nombre completo',
      'password': 'Contraseña',
      'confirmPassword': 'Confirmar contraseña'
    };
    return fieldNames[fieldName] || fieldName;
  }
}