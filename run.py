#!/usr/bin/env python3

import argparse
import os
import webbrowser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


def parse_args():
    parser = argparse.ArgumentParser(
        description="Serve this folder and open the Phaser game in your browser."
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port to run the local HTTP server on (default: 8000).",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    project_dir = os.path.dirname(os.path.abspath(__file__))
    handler = partial(SimpleHTTPRequestHandler, directory=project_dir)
    server = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
    game_url = f"http://127.0.0.1:{args.port}/game.html"

    print(f"Serving {project_dir}")
    print(f"Game URL: {game_url}")
    print("Press Ctrl+C to stop.")

    webbrowser.open(game_url)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server...")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
