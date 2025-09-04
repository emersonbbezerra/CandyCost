import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { userService } from '../services/userService';
import { hashPassword, verifyPassword } from '../utils/authUtils';

export const promoteUser = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email é obrigatório' });
    }

    const promotedUser = await userService.promoteToAdmin(email);
    res.json({
      message: 'Usuário promovido a administrador com sucesso',
      user: promotedUser,
    });
  } catch (error: any) {
    console.error('Error promoting user:', error);
    res.status(400).json({ message: error.message });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Erro ao buscar perfil do usuário' });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const updateSchema = z.object({
      firstName: z.string().min(1, 'Nome é obrigatório'),
      lastName: z.string().optional(),
      email: z.string().email('Email inválido'),
    });

    const validated = updateSchema.parse(req.body);

    // Verificar se o email já está sendo usado por outro usuário
    const existingUser = await prisma.user.findFirst({
      where: { email: validated.email },
    });
    if (existingUser && existingUser.id !== userId) {
      return res
        .status(400)
        .json({ message: 'Este email já está sendo usado por outro usuário' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: validated.firstName,
        lastName: validated.lastName || null,
        email: validated.email,
        updatedAt: new Date(),
      },
    });

    res.json({ message: 'Perfil atualizado com sucesso' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0].message });
    }
    res.status(500).json({ message: 'Erro ao atualizar perfil' });
  }
};

export const changeUserPassword = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const passwordSchema = z.object({
      currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
      newPassword: z
        .string()
        .min(8, 'Nova senha deve ter pelo menos 8 caracteres')
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+\-_=.])[A-Za-z\d@$!%*?&#+\-_=.]+$/,
          'Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial (@$!%*?&#+-_.=)'
        ),
    });

    const { currentPassword, newPassword } = passwordSchema.parse(req.body);

    // Verify current password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const isCurrentPasswordValid = await verifyPassword(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Senha atual incorreta' });
    }

    // Atualizar senha
    const hashedNewPassword = await hashPassword(newPassword);
    await userService.updateUserPassword(userId, hashedNewPassword);

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Error changing password:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.issues[0].message });
    }
    res.status(500).json({ message: 'Erro ao alterar senha' });
  }
};

export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const allUsers = await userService.getAllUsers();
    res.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Erro ao buscar usuários' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updateSchema = z.object({
      firstName: z.string().min(1, 'Nome é obrigatório'),
      lastName: z.string().optional(),
      email: z.string().email('Email inválido'),
      role: z.enum(['user', 'admin']),
    });

    const validated = updateSchema.parse(req.body);

    // Verificar se o email já está sendo usado por outro usuário
    const existingUser = await userService.getUserByEmail(validated.email);
    if (existingUser && existingUser.id !== userId) {
      return res
        .status(400)
        .json({ message: 'Este email já está sendo usado por outro usuário' });
    }

    const updatedUser = await userService.updateUser(userId, validated);
    res.json({ message: 'Usuário atualizado com sucesso', user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: 'Dados inválidos', errors: error.issues });
    }
    res.status(500).json({ message: 'Erro ao atualizar usuário' });
  }
};

export const resetUserPassword = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const passwordSchema = z.object({
      newPassword: z
        .string()
        .min(8, 'Nova senha deve ter pelo menos 8 caracteres')
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+\-_=.])[A-Za-z\d@$!%*?&#+\-_=.]+$/,
          'Nova senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial (@$!%*?&#+-_.=)'
        ),
    });

    const { newPassword } = passwordSchema.parse(req.body);

    const hashedPassword = await hashPassword(newPassword);
    await userService.updateUserPassword(userId, hashedPassword);

    res.json({ message: 'Senha resetada com sucesso' });
  } catch (error) {
    console.error('Error resetting password:', error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: 'Dados inválidos', errors: error.issues });
    }
    res.status(500).json({ message: 'Erro ao resetar senha' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === (req as any).user.id) {
      return res
        .status(400)
        .json({ message: 'Você não pode excluir sua própria conta' });
    }

    await userService.deleteUser(userId);
    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Erro ao excluir usuário' });
  }
};
