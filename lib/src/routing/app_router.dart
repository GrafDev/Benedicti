import 'package:benedict/src/features/authentication/data/auth_repository.dart';
import 'package:benedict/src/features/authentication/presentation/sign_in_screen.dart';
import 'package:benedict/src/features/authentication/presentation/sign_up_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'dart:async';

import '../features/home/home_screen.dart';

part 'app_router.g.dart';

@riverpod
GoRouter goRouter(Ref ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: true,
    redirect: (context, state) {
      final isLoggedIn = authState.valueOrNull != null;
      final isLoggingIn =
          state.uri.path == '/login' || state.uri.path == '/register';

      // Protected routes
      if (state.uri.path.startsWith('/dictionaries')) {
        if (!isLoggedIn) return '/login';
      }

      // Redirect connected users away from login
      if (isLoggedIn && isLoggingIn) {
        return '/dictionaries';
      }

      return null;
    },
    refreshListenable: GoRouterRefreshStream(
      ref.watch(authStateProvider.stream),
    ),
    routes: [
      GoRoute(
        path: '/',
        name: 'home',
        builder: (context, state) => const HomeScreen(),
        routes: [
          GoRoute(
            path: 'login',
            name: 'login',
            builder: (context, state) => const SignInScreen(),
          ),
          GoRoute(
            path: 'register',
            name: 'register',
            builder: (context, state) => const SignUpScreen(),
          ),
          GoRoute(
            path: 'dictionaries',
            name: 'dictionaries',
            builder: (context, state) => const Scaffold(
              body: Center(child: Text('Dictionaries Screen')),
            ),
          ),
        ],
      ),
    ],
  );
}

class GoRouterRefreshStream extends ChangeNotifier {
  GoRouterRefreshStream(Stream<dynamic> stream) {
    notifyListeners();
    _subscription = stream.listen((dynamic _) => notifyListeners());
  }

  late final StreamSubscription<dynamic> _subscription;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
