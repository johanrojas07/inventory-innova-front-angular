import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { User } from "../../models/User";
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class LoginComponent implements OnInit, OnDestroy {

  public user;
  public token;
  public identity;
  public data_error;
  public isSubmitting: boolean = false;
  public showPassword: boolean = false;
  public emailError: string = '';
  public passwordError: string = '';
  public emailTouched: boolean = false;
  public passwordTouched: boolean = false;
  public loginAttempts: number = 0;
  public isLocked: boolean = false;
  public lockoutTime: number = 0;
  public cursorX: number = 0;
  public cursorY: number = 0;
  public bubbles: any[] = [];
  public isBlinking: boolean = false;
  public isLookingUp: boolean = false;
  public isLookingDown: boolean = false;
  public isSmiling: boolean = false;
  public isSurprised: boolean = false;
  public isPasswordTyping: boolean = false;
  public avatarX: number = 0;
  public avatarY: number = 0;
  private blinkInterval: any;
  private bubbleCheckInterval: any;

  constructor(
    private _userService: UserService,
    private _router: Router,
    private toastr: ToastrService
  ) {
    this.user = new User('', '', '', '', '');
    this.identity = this._userService.getIdentity();
    
    // Verificar si hay intentos de login bloqueados
    const lockoutData = localStorage.getItem('loginLockout');
    if (lockoutData) {
      const lockout = JSON.parse(lockoutData);
      const now = new Date().getTime();
      if (now < lockout.until) {
        this.isLocked = true;
        this.lockoutTime = Math.ceil((lockout.until - now) / 1000);
        this.startLockoutTimer();
      } else {
        localStorage.removeItem('loginLockout');
        localStorage.removeItem('loginAttempts');
      }
    }
  }

  ngOnInit() {
    if (this.identity) {
      this._router.navigate(['ventas']);
    }
    
    // Inicializar burbujas
    this.initBubbles();
    
    // Iniciar animación de parpadeo
    this.startBlinking();
    
    // Iniciar detección de colisiones con burbujas
    this.startBubbleCollisionDetection();
  }

  ngOnDestroy() {
    if (this.blinkInterval) {
      clearInterval(this.blinkInterval);
    }
    if (this.bubbleCheckInterval) {
      clearInterval(this.bubbleCheckInterval);
    }
  }

  initBubbles() {
    const bubbleCount = 15;
    for (let i = 0; i < bubbleCount; i++) {
      this.bubbles.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 30 + Math.random() * 50,
        duration: 15 + Math.random() * 20,
        delay: Math.random() * 5,
        hit: false,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5
      });
    }
  }

  startBlinking() {
    this.blinkInterval = setInterval(() => {
      this.isBlinking = true;
      setTimeout(() => {
        this.isBlinking = false;
      }, 150);
    }, 3000 + Math.random() * 2000);
  }

  startBubbleCollisionDetection() {
    this.bubbleCheckInterval = setInterval(() => {
      const cursorRadius = 30;
      this.bubbles.forEach((bubble, index) => {
        const bubbleX = (bubble.x / 100) * window.innerWidth;
        const bubbleY = (bubble.y / 100) * window.innerHeight;
        const distance = Math.sqrt(
          Math.pow(this.cursorX - bubbleX, 2) + Math.pow(this.cursorY - bubbleY, 2)
        );
        
        if (distance < cursorRadius + bubble.size / 2) {
          bubble.hit = true;
          // Hacer que la burbuja se mueva alejándose del cursor
          const angle = Math.atan2(bubbleY - this.cursorY, bubbleX - this.cursorX);
          bubble.vx = Math.cos(angle) * 0.8;
          bubble.vy = Math.sin(angle) * 0.8;
          
          setTimeout(() => {
            bubble.hit = false;
          }, 500);
          
          // Colisión con otras burbujas
          this.bubbles.forEach((otherBubble, otherIndex) => {
            if (index !== otherIndex) {
              const otherX = (otherBubble.x / 100) * window.innerWidth;
              const otherY = (otherBubble.y / 100) * window.innerHeight;
              const bubbleDistance = Math.sqrt(
                Math.pow(bubbleX - otherX, 2) + Math.pow(bubbleY - otherY, 2)
              );
              
              if (bubbleDistance < (bubble.size + otherBubble.size) / 2) {
                const collisionAngle = Math.atan2(otherY - bubbleY, otherX - bubbleX);
                otherBubble.vx = Math.cos(collisionAngle) * 0.5;
                otherBubble.vy = Math.sin(collisionAngle) * 0.5;
                otherBubble.hit = true;
                setTimeout(() => {
                  otherBubble.hit = false;
                }, 300);
              }
            }
          });
        }
        
        // Actualizar posición de la burbuja
        bubble.x += bubble.vx;
        bubble.y += bubble.vy;
        
        // Rebotar en los bordes
        if (bubble.x < 0 || bubble.x > 100) bubble.vx *= -1;
        if (bubble.y < 0 || bubble.y > 100) bubble.vy *= -1;
        
        // Mantener dentro de los límites
        bubble.x = Math.max(0, Math.min(100, bubble.x));
        bubble.y = Math.max(0, Math.min(100, bubble.y));
      });
    }, 50);
  }

  onAvatarHover() {
    this.isSurprised = true;
    this.isSmiling = true;
    setTimeout(() => {
      this.isSurprised = false;
    }, 500);
  }

  onAvatarLeave() {
    this.isSmiling = false;
  }

  onPasswordFocus() {
    this.isPasswordTyping = true;
    this.isBlinking = true;
    setTimeout(() => {
      this.isBlinking = false;
    }, 150);
  }

  onPasswordBlur() {
    this.passwordTouched = true;
    this.validatePassword(this.user.password);
    this.isPasswordTyping = false;
  }

  onPasswordInput() {
    if (this.passwordTouched) {
      this.validatePassword(this.user.password);
    }
    // Mantener los ojos cerrados mientras se escribe
    this.isPasswordTyping = true;
  }

  startLockoutTimer() {
    const interval = setInterval(() => {
      this.lockoutTime--;
      if (this.lockoutTime <= 0) {
        this.isLocked = false;
        this.lockoutTime = 0;
        localStorage.removeItem('loginLockout');
        localStorage.removeItem('loginAttempts');
        clearInterval(interval);
      }
    }, 1000);
  }

  close_alert() {
    this.data_error = '';
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  onMouseMove(event: MouseEvent) {
    this.cursorX = event.clientX;
    this.cursorY = event.clientY;
    
    // Calcular posición del avatar para que los ojos sigan el cursor
    const avatarElement = document.querySelector('.avatar-face');
    if (avatarElement) {
      const rect = avatarElement.getBoundingClientRect();
      this.avatarX = rect.left + rect.width / 2;
      this.avatarY = rect.top + rect.height / 2;
    }
  }

  getPupilTransform(eye: 'left' | 'right'): string {
    if (this.isPasswordTyping || this.isBlinking) {
      return 'translate(-50%, -50%)';
    }
    
    const eyeOffset = eye === 'left' ? -15 : 15;
    const eyeX = this.avatarX + eyeOffset;
    const eyeY = this.avatarY - 10;
    
    const dx = this.cursorX - eyeX;
    const dy = this.cursorY - eyeY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = 20;
    
    if (distance > maxDistance) {
      const angle = Math.atan2(dy, dx);
      const moveX = Math.cos(angle) * 3;
      const moveY = Math.sin(angle) * 3;
      return `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
    }
    
    return 'translate(-50%, -50%)';
  }

  validateEmail(email: string): boolean {
    if (!email) {
      this.emailError = 'El usuario es requerido';
      return false;
    }
    
    if (email.trim().length < 3) {
      this.emailError = 'El usuario debe tener al menos 3 caracteres';
      return false;
    }
    
    this.emailError = '';
    return true;
  }

  validatePassword(password: string): boolean {
    if (!password) {
      this.passwordError = 'La contraseña es requerida';
      return false;
    }
    
    if (password.length < 6) {
      this.passwordError = 'La contraseña debe tener al menos 6 caracteres';
      return false;
    }
    
    this.passwordError = '';
    return true;
  }

  onEmailBlur() {
    this.emailTouched = true;
    this.validateEmail(this.user.email);
  }

  onEmailInput() {
    if (this.emailTouched) {
      this.validateEmail(this.user.email);
    }
  }


  getPasswordStrength(): { strength: string; percentage: number; color: string } {
    const password = this.user.password || '';
    let strength = 0;
    
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 15;
    if (/[^a-zA-Z\d]/.test(password)) strength += 10;
    
    if (strength < 30) {
      return { strength: 'Débil', percentage: strength, color: '#ef4444' };
    } else if (strength < 60) {
      return { strength: 'Media', percentage: strength, color: '#f59e0b' };
    } else if (strength < 80) {
      return { strength: 'Buena', percentage: strength, color: '#3b82f6' };
    } else {
      return { strength: 'Fuerte', percentage: strength, color: '#10b981' };
    }
  }

  login(loginForm) {
    if (this.isLocked) {
      this.toastr.warning(`Demasiados intentos fallidos. Intente nuevamente en ${this.lockoutTime} segundos`, 'Cuenta Bloqueada', {
        timeOut: 5000
      });
      return;
    }

    // Validar campos
    const emailValid = this.validateEmail(this.user.email);
    const passwordValid = this.validatePassword(this.user.password);
    
    this.emailTouched = true;
    this.passwordTouched = true;

    if (!emailValid || !passwordValid || !loginForm.valid) {
      this.toastr.warning('Por favor complete todos los campos correctamente', 'Validación', {
        timeOut: 3000
      });
      return;
    }

    this.isSubmitting = true;
    this.data_error = '';

    this._userService.login(this.user).subscribe(
      response => {
        // Resetear intentos de login
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('loginLockout');
        this.loginAttempts = 0;

        this.token = response.jwt;
        localStorage.setItem('token', this.token);

        this._userService.login(this.user, true).subscribe(
          response => {
            localStorage.setItem('identity', JSON.stringify(response.user));
            this.toastr.success('¡Bienvenido!', 'Login Exitoso', {
              timeOut: 2000
            });
            setTimeout(() => {
              this._router.navigate(['ventas']);
            }, 500);
          },
          error => {
            this.isSubmitting = false;
            this.toastr.error('Error al obtener información del usuario', 'Error', {
              timeOut: 5000
            });
          }
        );
      },
      error => {
        this.isSubmitting = false;
        
        // Incrementar intentos de login
        this.loginAttempts++;
        const attempts = parseInt(localStorage.getItem('loginAttempts') || '0') + 1;
        localStorage.setItem('loginAttempts', attempts.toString());

        // Bloquear después de 5 intentos fallidos
        if (attempts >= 5) {
          const lockoutUntil = new Date().getTime() + (5 * 60 * 1000); // 5 minutos
          localStorage.setItem('loginLockout', JSON.stringify({ until: lockoutUntil }));
          this.isLocked = true;
          this.lockoutTime = 300; // 5 minutos en segundos
          this.startLockoutTimer();
          
          this.toastr.error('Demasiados intentos fallidos. Su cuenta ha sido bloqueada por 5 minutos', 'Cuenta Bloqueada', {
            timeOut: 7000
          });
        } else {
          const errorMsg = error.error && error.error.message ? error.error.message : 'Credenciales inválidas';
          this.data_error = errorMsg;
          this.toastr.error(errorMsg, 'Error de Autenticación', {
            timeOut: 5000
          });
          
          if (attempts >= 3) {
            this.toastr.warning(`Le quedan ${5 - attempts} intentos antes del bloqueo`, 'Advertencia', {
              timeOut: 4000
            });
          }
        }
      }
    );
  }
}
