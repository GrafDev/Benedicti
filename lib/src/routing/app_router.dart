import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../features/home/home_screen.dart';

part 'app_router.g.dart';

@riverpod
GoRouter goRouter(Ref ref) {
  return GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: true,
    routes: [
      GoRoute(
        path: '/',
        name: 'home',
        builder: (context, state) => const HomeScreen(),
        routes: [
          GoRoute(
            path: 'login',
            name: 'login',
            builder: (context, state) =>
                const Scaffold(body: Center(child: Text('Login Screen'))),
          ),
          GoRoute(
            path: 'register',
            name: 'register',
            builder: (context, state) =>
                const Scaffold(body: Center(child: Text('Register Screen'))),
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
