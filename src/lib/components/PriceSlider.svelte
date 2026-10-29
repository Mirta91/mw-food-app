<script lang="ts">
  import { formatPrice } from "../utils/format.ts";

  let { value = $bindable(), min, max }: { value: number; min: number; max: number } = $props();
</script>

<label>
  <span class="row">
    <span>Max. lunch price</span>
    <strong>{formatPrice(value)}</strong>
  </span>
  <input type="range" {min} {max} step="1" bind:value />
</label>

<style>
  label {
    display: grid;
    gap: 20px;
  }

  .row {
    display: flex;
    justify-content: space-between;
    font-size: 1.1rem;
  }

  strong {
    font-size: 1.3rem;
  }

  input {
    width: 100%;
    height: 38px;
    margin: 0;
    border-radius: 999px;
    background: var(--surface);
    appearance: none;
    cursor: pointer;
  }

  input::-webkit-slider-thumb {
    width: 32px;
    height: 32px;
    border: 1px solid var(--border);
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.15);
    appearance: none;
  }

  input::-moz-range-thumb {
    width: 32px;
    height: 32px;
    border: 1px solid var(--border);
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.15);
  }

  input:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
</style>
