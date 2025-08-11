import passport from 'passport';
import { z } from 'zod';
import {
  passwordErrorMessage,
  passwordRegex,
} from '../../shared/passwordValidation';
import { userService } from '../services/userService';
import { auditLog } from '../utils/auditLogger';

export const login = (req: any, res: any, next: any) => {
  passport.authenticate('local', (err: any, user: any, info: any) => {
    if (err) {
      auditLog('LOGIN_ERROR', `Erro durante login: ${err.message}`, {
        ip: req.ip,
        email: req.body.email,
      });
      return res
        .status(500)
        .json({
          message:
            'Ocorreu um problema no sistema. Tente novamente em alguns minutos.',
        });
    }
    if (!user) {
      auditLog(
        'LOGIN_FAILURE',
        `Falha no login para email: ${req.body.email}`,
        {
          ip: req.ip,
          email: req.body.email,
        }
      );
      return res
        .status(401)
        .json({
          message:
            info.message ||
            'Email ou senha incorretos. Verifique suas informações.',
        });
    }
    req.logIn(user, (err: any) => {
      if (err) {
        auditLog('LOGIN_ERROR', `Erro durante login: ${err.message}`, {
          ip: req.ip,
          email: req.body.email,
        });
        return res
          .status(500)
          .json({
            message: 'Problema no sistema durante o login. Tente novamente.',
          });
      }
      auditLog('LOGIN_SUCCESS', `Login realizado com sucesso: ${user.email}`, {
        userId: user.id,
        email: user.email,
        ip: req.ip,
      });
      return res.json({
        message: 'Login realizado com sucesso',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    });
  })(req, res, next);
};

export const register = async (req: any, res: any) => {
  try {
    const registerSchema = z.object({
      email: z.string().email('Email inválido'),
      password: z
        .string()
        .min(8, 'Senha deve ter pelo menos 8 caracteres')
        .regex(passwordRegex, passwordErrorMessage),
      firstName: z.string().min(1, 'Nome é obrigatório'),
      lastName: z.string().optional(),
    });

    const { email, password, firstName, lastName } = registerSchema.parse(
      req.body
    );

    // Check if user already exists
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      auditLog(
        'REGISTER_FAILURE',
        `Falha no cadastro: email já cadastrado ${email}`,
        {
          ip: req.ip,
          email,
        }
      );
      return res
        .status(400)
        .json({
          message:
            'Este email já está cadastrado. Use outro email ou faça login.',
        });
    }

    // Create new user
    const newUser = await userService.createUser({
      email,
      password,
      firstName,
      lastName,
      role: 'user',
    });

    // Log the user in
    req.logIn(newUser, (err: any) => {
      if (err) {
        auditLog(
          'REGISTER_ERROR',
          `Erro durante login automático após cadastro: ${err.message}`,
          {
            ip: req.ip,
            email,
          }
        );
        return res
          .status(500)
          .json({
            message:
              'Conta criada com sucesso, mas houve um problema no login automático. Tente fazer login manualmente.',
          });
      }
      auditLog('REGISTER_SUCCESS', `Cadastro realizado com sucesso: ${email}`, {
        userId: newUser.id,
        email,
        ip: req.ip,
      });
      return res.status(201).json({
        message: 'Usuário criado com sucesso',
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
        },
      });
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0].message });
    }
    const errMsg = error instanceof Error ? error.message : 'Erro desconhecido';
    auditLog('REGISTER_ERROR', `Erro no cadastro: ${errMsg}`, {
      ip: req.ip,
      email: req.body.email,
    });
    console.error('Register error:', error);
    res
      .status(500)
      .json({
        message:
          'Ocorreu um problema no cadastro. Tente novamente em alguns minutos.',
      });
  }
};

export const logoutGet = (req: any, res: any) => {
  req.logout((err: any) => {
    if (err) {
      auditLog('LOGOUT_ERROR', `Erro durante logout: ${err.message}`, {
        userId: (req.user as any)?.id,
        email: (req.user as any)?.email,
        ip: req.ip,
      });
      console.error('Logout error:', err);
      return res.redirect('/?error=logout');
    }

    auditLog('LOGOUT_SUCCESS', `Logout realizado com sucesso`, {
      userId: (req.user as any)?.id,
      email: (req.user as any)?.email,
      ip: req.ip,
    });

    // Destroy the session
    req.session.destroy((destroyErr: any) => {
      if (destroyErr) {
        auditLog(
          'SESSION_DESTROY_ERROR',
          `Erro ao destruir sessão: ${destroyErr.message}`,
          {
            userId: (req.user as any)?.id,
            email: (req.user as any)?.email,
            ip: req.ip,
          }
        );
        console.error('Session destroy error:', destroyErr);
        return res.redirect('/?error=session');
      }

      // Clear the session cookie and redirect
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  });
};

export const logoutPost = (req: any, res: any) => {
  req.logout((err: any) => {
    if (err) {
      auditLog('LOGOUT_ERROR', `Erro durante logout: ${err.message}`, {
        userId: (req.user as any)?.id,
        email: (req.user as any)?.email,
        ip: req.ip,
      });
      console.error('Logout error:', err);
      return res
        .status(500)
        .json({
          message: 'Houve um problema ao sair da conta. Tente novamente.',
        });
    }

    auditLog('LOGOUT_SUCCESS', `Logout realizado com sucesso`, {
      userId: (req.user as any)?.id,
      email: (req.user as any)?.email,
      ip: req.ip,
    });

    // Destroy the session
    req.session.destroy((destroyErr: any) => {
      if (destroyErr) {
        auditLog(
          'SESSION_DESTROY_ERROR',
          `Erro ao destruir sessão: ${destroyErr.message}`,
          {
            userId: (req.user as any)?.id,
            email: (req.user as any)?.email,
            ip: req.ip,
          }
        );
        console.error('Session destroy error:', destroyErr);
        return res
          .status(500)
          .json({
            message: 'Problema ao finalizar a sessão. Tente novamente.',
          });
      }

      // Clear the session cookie
      res.clearCookie('connect.sid');
      res.json({ message: 'Logout realizado com sucesso' });
    });
  });
};

export const getUser = (req: any, res: any) => {
  const user = req.user as any;
  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  });
};
