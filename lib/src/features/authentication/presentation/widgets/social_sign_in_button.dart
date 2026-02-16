import 'package:flutter/material.dart';
import 'package:gap/gap.dart';

class SocialSignInButton extends StatelessWidget {
  final String text;
  final VoidCallback onPressed;
  final String? assetName;
  final Color backgroundColor;
  final Color textColor;

  const SocialSignInButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.assetName,
    this.backgroundColor = Colors.white,
    this.textColor = Colors.black87,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 44,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor,
          foregroundColor: textColor,
          elevation: 1,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: const BorderSide(color: Colors.black12),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
        ),
        onPressed: onPressed,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (assetName != null) ...[
              Image.asset(assetName!, height: 24),
              const Gap(12),
            ],
            Text(
              text,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }
}
