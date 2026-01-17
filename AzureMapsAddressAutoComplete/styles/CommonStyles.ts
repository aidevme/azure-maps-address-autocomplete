import { makeStyles, tokens } from '@fluentui/react-components';

/**
 * Styles for the AzureMapsAddressAutoComplete component.
 */
export const useAzureMapsAddressAutoCompleteStyles = makeStyles({
  /** Root container styles. */
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    width: '100%',
    position: 'relative',
  },
  /** Input field styles. */
  input: {
    width: '100%',
    // Ensure the input's internal wrapper doesn't hide the search icon
    '& .fui-Input__contentAfter': {
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      paddingRight: tokens.spacingHorizontalXS,
    },
  },
  /** Dropdown container styles. */
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000001, // High z-index to appear above Model-Driven App UI layers (which use 10000+)
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow16,
    borderRadius: tokens.borderRadiusMedium,
    marginTop: tokens.spacingVerticalXS,
    maxHeight: '300px',
    overflowY: 'auto',
    padding: tokens.spacingVerticalXS,
  },
  /** Suggestion item styles. */
  suggestionItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalS,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    marginBottom: '8px',
    cursor: 'pointer',
    borderRadius: tokens.borderRadiusSmall,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
    ':last-child': {
      marginBottom: 0,
    },
  },
  /** Suggestion icon styles. */
  suggestionIcon: {
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
    marginTop: '2px', // Align with first line of text
  },
  /** Suggestion text styles. */
  suggestionText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: '"Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
    fontSize: '14px',
    fontWeight: tokens.fontWeightRegular,
    lineHeight: '20px',
    color: '#242424',
  },
  /** Suggestion content container for two-line layout. */
  suggestionContent: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flex: 1,
  },
  /** Secondary line styles for additional details. */
  suggestionSecondary: {
    fontFamily: '"Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif',
    fontSize: '12px',
    fontWeight: tokens.fontWeightRegular,
    lineHeight: '16px',
    color: '#616161',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  /** Hint text styles shown below input after selection. */
  hint: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorPaletteGreenForeground1,
    paddingLeft: tokens.spacingHorizontalS,
    paddingTop: tokens.spacingVerticalXXS,
  },
  /** Search icon styles for the input contentAfter slot. */
  searchIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: tokens.colorNeutralForeground3,
    // Set dimensions via font-size for CSP compliance
    // Icons inherit size from parent fontSize
    fontSize: '20px',
    lineHeight: '20px',
  },
  /** Globe button styles with hover effect. */
  globeButton: {
    color: '#616161',
    ':hover': {
      color: '#0078d4',
    },
    ':hover svg': {
      color: '#0078d4',
    },
  },
});

/**
 * Styles for the AzureMapsPanel dialog component.
 */
export const useAzureMapsPanelStyles = makeStyles({
  /** Dialog surface styles. */
  surface: {
    maxWidth: '480px',
    minWidth: '400px',
  },
  /** Dialog title container styles with text truncation. */
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    overflow: 'hidden',
    minWidth: 0,
  },
  /** Title icon styles. */
  titleIcon: {
    color: '#0078D4',
    flexShrink: 0,
  },
  /** Title text styles with ellipsis truncation. */
  titleText: {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    minWidth: 0,
  },
  /** Content section styles. */
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    fontSize: tokens.fontSizeBase200,
  },
  /** Interactive map container styles. */
  mapContainer: {
    position: 'relative',
    width: '100%',
    height: '280px',
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: tokens.spacingVerticalS,
    overflow: 'hidden',
  },
  /** Map element styles. */
  mapElement: {
    width: '100%',
    height: '100%',
  },
  /** Map loading overlay styles. */
  mapLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.colorNeutralBackground3,
    zIndex: 1,
  },
});

/**
 * Styles for the AzureMapsAddressDialog component.
 */
export const useAzureMapsAddressDialogStyles = makeStyles({
  /** Dialog surface styles. */
  dialogSurface: {
    maxWidth: '560px',
  },
  /** Title container styles. */
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  /** Error icon styles. */
  errorIcon: {
    color: tokens.colorStatusDangerForeground1,
  },
  /** Error summary container styles. */
  errorSummary: {
    backgroundColor: tokens.colorPaletteRedBackground1,
    borderLeftWidth: '4px',
    borderLeftStyle: 'solid',
    borderLeftColor: tokens.colorStatusDangerForeground1,
    borderRadius: tokens.borderRadiusMedium,
    padding: '16px',
    marginBottom: '20px',
  },
  /** Error code badge styles. */
  errorCodeBadge: {
    display: 'inline-block',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorStatusDangerForeground1}`,
    color: tokens.colorStatusDangerForeground1,
    padding: '4px 12px',
    borderRadius: tokens.borderRadiusSmall,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    fontFamily: 'Consolas, monospace',
    marginBottom: '8px',
  },
  /** HTTP status text styles. */
  httpStatus: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    marginBottom: '12px',
    display: 'block',
  },
  /** Error message text styles. */
  errorMessage: {
    color: tokens.colorNeutralForeground1,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
  },
  /** Section container styles. */
  section: {
    marginTop: '20px',
  },
  /** Section title styles. */
  sectionTitle: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  /** Info icon styles. */
  infoIcon: {
    color: tokens.colorBrandForeground1,
  },
  /** Details list container styles. */
  detailsList: {
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '12px',
  },
  /** Detail item styles. */
  detailItem: {
    paddingTop: '8px',
    paddingBottom: '8px',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground1,
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke1,
    ':last-child': {
      borderBottom: 'none',
    },
  },
  /** Detail label styles. */
  detailLabel: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase100,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    display: 'block',
    marginBottom: '4px',
  },
  /** Troubleshooting section styles. */
  troubleshooting: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusMedium,
    padding: '16px',
    marginBottom: '16px',
  },
  /** Troubleshooting item styles. */
  troubleshootingItem: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px',
    fontSize: tokens.fontSizeBase200,
    ':last-child': {
      marginBottom: '0',
    },
  },
  /** Bullet point styles. */
  bullet: {
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightBold,
    flexShrink: 0,
  },
  /** Footer actions container styles. */
  footerActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  /** Footer links container styles. */
  footerLinks: {
    display: 'flex',
    gap: '16px',
  },
  /** Footer link styles. */
  footerLink: {
    fontSize: tokens.fontSizeBase200,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  /** Button group styles. */
  buttonGroup: {
    display: 'flex',
    gap: '8px',
  },
});
