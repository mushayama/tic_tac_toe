# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from "eslint-plugin-react";

export default tseslint.config({
  // Set the react version
  settings: { react: { version: "18.3" } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs["jsx-runtime"].rules,
  },
});
```

# deploying on gcp gce vm

- build on local using: npm run build
- upload the ./dist folder files to a path in the VM like: sudo gcloud compute scp --recurse ./dist instance-20250220-133151:/home/marbab_arbab/project/frontend
- download nginx on the VM

  - Install Nginx (to serve static files): On your VM, install Nginx:

    ```bash
    sudo apt-get install -y nginx
    ```

  - Configure Nginx to Serve the React App: Edit the Nginx config file (/etc/nginx/sites-available/default) to serve your React app.

    Example configuration:

    ```nginx
    server {
    listen 80;
    root /home/username/project/frontend;
    index index.html;

        server_name _;

        location / {
            try_files $uri /index.html;
        }

    }
    ```

  - Restart Nginx:
    ```bash
    sudo systemctl restart nginx
    ```
  - Your React frontend should now be accessible via the VM’s external IP address on port 80.
