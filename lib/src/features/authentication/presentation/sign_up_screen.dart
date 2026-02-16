import 'package:benedict/src/common/widgets/primary_button.dart';
import 'package:benedict/src/features/authentication/presentation/auth_controller.dart';
import 'package:benedict/src/features/authentication/presentation/widgets/auth_text_field.dart';
import 'package:benedict/src/features/authentication/presentation/widgets/social_sign_in_button.dart';
import 'package:benedict/src/localization/generated/app_localizations.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:gap/gap.dart';
import 'package:go_router/go_router.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({super.key});

  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_formKey.currentState!.validate()) {
      await ref
          .read(authControllerProvider.notifier)
          .signUp(
            email: _emailController.text.trim(),
            password: _passwordController.text.trim(),
          );
    }
  }

  @override
  Widget build(BuildContext context) {
    final loc = AppLocalizations.of(context)!;
    final state = ref.watch(authControllerProvider);

    ref.listen<AsyncValue<void>>(authControllerProvider, (_, state) {
      if (state.hasError && !state.isLoading) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(state.error.toString())));
      }
    });

    return Scaffold(
      appBar: AppBar(title: Text(loc.navRegister)),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    loc.signUpButton,
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  const Gap(32),
                  AuthTextField(
                    controller: _emailController,
                    label: loc.emailLabel,
                    keyboardType: TextInputType.emailAddress,
                    validator: (value) =>
                        (value == null || !value.contains('@'))
                        ? 'Invalid email'
                        : null,
                  ),
                  const Gap(16),
                  AuthTextField(
                    controller: _passwordController,
                    label: loc.passwordLabel,
                    obscureText: true,
                    validator: (value) => (value == null || value.length < 6)
                        ? 'Password too short'
                        : null,
                  ),
                  const Gap(32),
                  PrimaryButton(
                    text: loc.signUpButton,
                    isLoading: state.isLoading,
                    onPressed: _submit,
                  ),
                  const Gap(24),
                  Row(
                    children: [
                      const Expanded(child: Divider()),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          'Or sign up with', // TODO: Localize
                          style: Theme.of(
                            context,
                          ).textTheme.bodyMedium?.copyWith(color: Colors.grey),
                        ),
                      ),
                      const Expanded(child: Divider()),
                    ],
                  ),
                  const Gap(24),
                  SocialSignInButton(
                    text: 'Sign up with Google', // TODO: Localize
                    onPressed: () => ref
                        .read(authControllerProvider.notifier)
                        .signInWithGoogle(),
                  ),
                  const Gap(12),
                  if (defaultTargetPlatform == TargetPlatform.iOS ||
                      defaultTargetPlatform == TargetPlatform.macOS)
                    SignInWithAppleButton(
                      text: 'Sign up with Apple', // Override text
                      onPressed: () => ref
                          .read(authControllerProvider.notifier)
                          .signInWithApple(),
                      height: 44,
                      style: SignInWithAppleButtonStyle.black,
                    ),
                  const Gap(16),
                  TextButton(
                    onPressed: () => context.go('/login'),
                    child: Text(loc.haveAccount),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
