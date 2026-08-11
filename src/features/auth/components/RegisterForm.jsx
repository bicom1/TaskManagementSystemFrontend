import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { registerSchema } from '../schemas/authSchemas';
import { useRegister } from '../hooks/useAuth';

export function RegisterForm() {
  const registerUser = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = (values) => {
    registerUser.mutate(values);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" autoComplete="name" {...register('name')} />
        {errors.name && (
          <p className="text-sm text-bloom-coral">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...register('email')} />
        {errors.email && (
          <p className="text-sm text-bloom-coral">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-sm text-bloom-coral">{errors.password.message}</p>
        )}
        <p className="text-xs text-graphite">At least 8 characters, one uppercase letter and one digit.</p>
      </div>

      <Button type="submit" className="w-full" disabled={registerUser.isPending}>
        {registerUser.isPending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  );
}
