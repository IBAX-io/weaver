/*---------------------------------------------------------------------------------------------
 *  Copyright (c) IBAX All rights reserved.
 *  See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

declare module 'ibax/theme' {
    interface IThemeDefinition {
        windowBorder: string;

        headerBackground: string;
        headerForeground: string;
        headerHeight: number;

        menubarSize: number;
        menubarBackground: string;
        menubarBackgroundActive: string;
        menubarBackgroundFocused: string;
        menubarBackgroundSecondary: string;
        menubarForeground: string;
        menubarForegroundActive: string;

        toolbarBackground: string;
        toolbarBackgroundActive: string;
        toolbarBackgroundFocused: string;
        toolbarForegroundActive: string;
        toolbarForegroundPrimary: string;
        toolbarForegroundDisabled: string;
        toolbarForeground: string;
        toolbarHeight: number;
        toolbarSpacerForeground: string;

        menuBackground: string;
        menuForeground: string;
        menuBackgroundActive: string;
        menuBorder: string;
        menuOutline: string;
        menuIconColor: string;
        menuPrimaryForeground: string;
        menuPrimaryActive: string;
        menuSize: number;
        menuSizeFolded: number;

        contentForeground: string;
        contentBackground: string;

        editorBackground: string;

        modalHeaderBackground: string;
        modalHeaderForeground: string;
        modalOutline: string;

        notificationBackground: string;
        notificationForeground: string;
        notificationIconColor: string;
        notificationPrimaryForeground: string;

        sectionButtonOutline: string;
        sectionButtonBackground: string;
        sectionButtonForeground: string;
        sectionButtonActive: string;
        sectionButtonPrimary: string;

        dropdownMenuBackground: string;
        dropdownMenuForeground: string;
        dropdownMenuDisabled: string;
        dropdownMenuActive: string;
        dropdownMenuSeparator: string;
        dropdownMenuPrimary: string;
        dropdownMenuSecondary: string;

        securityWarningBackground: string;
        securityWarningForeground: string;

        uiBorderLight: string;
    }
}